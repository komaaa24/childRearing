import { Request, Response } from "express";
import { Payment, PaymentStatus } from "../entities/Payment.js";
import { AppDataSource } from "../database/data-source.js";
import { BotAccessService } from "../services/bot-access.service.js";
import { Bot } from "grammy";
import { verifyClickPaymentByMTI } from "../services/click-verify.service.js";
import { getMessages, normalizeLanguage } from "../services/i18n.service.js";
import { normalizeBotUsername, resolveBotKey } from "../services/bot-scope.service.js";

const botAccessService = new BotAccessService();

type BotResolver = Bot | ((botUsername: string, payment: Payment) => Bot | undefined | Promise<Bot | undefined>);

async function resolveTargetBot(botResolver: BotResolver, botUsername: string, payment: Payment): Promise<Bot | undefined> {
    if (typeof botResolver === "function") {
        return botResolver(botUsername, payment);
    }

    return botResolver;
}

/**
 * 💰 Click to'lov webhook handler
 * To'lov amalga oshgach avtomatik tasdiqlanadi
 */
export async function handlePaymentWebhook(req: Request, res: Response, botResolver: BotResolver) {
    const { tx, status, amount, user_id, bot_username } = req.body;

    console.log("📥 [WEBHOOK] Click payment notification:", {
        tx,
        status,
        amount,
        user_id,
        fullBody: req.body
    });

    const webhookSecret = (process.env.PAYMENT_WEBHOOK_SECRET || "").trim();
    if (webhookSecret) {
        const provided = String(req.headers["x-webhook-secret"] || "").trim();
        if (provided !== webhookSecret) {
            console.warn("❌ [WEBHOOK] Invalid webhook secret");
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
    }

    if (!tx) {
        return res.status(400).json({
            error: "transaction_param required"
        });
    }

    const paymentRepo = AppDataSource.getRepository(Payment);

    // Tranzaksiyani topish
    const payment = await paymentRepo.findOne({
        where: { transactionParam: tx },
        relations: ["user"]
    });

    if (!payment) {
        console.warn("⚠️ [WEBHOOK] Payment not found for tx:", tx);
        return res.status(404).json({
            error: "Payment not found"
        });
    }

    const scopedBotUsername = normalizeBotUsername(
        payment.botUsername || payment.metadata?.botUsername || payment.user?.botUsername
    );
    const paymentTelegramId = Number(payment.metadata?.telegramId ?? payment.user?.telegramId);
    const webhookTelegramId = Number(user_id);
    const webhookBotUsername = normalizeBotUsername(bot_username);

    if (Number.isFinite(webhookTelegramId) && webhookTelegramId > 0 && webhookTelegramId !== paymentTelegramId) {
        console.warn("❌ [WEBHOOK] User mismatch:", {
            tx,
            expectedTelegramId: paymentTelegramId,
            receivedTelegramId: webhookTelegramId
        });
        return res.status(400).json({ success: false, message: "User mismatch" });
    }

    if (bot_username && webhookBotUsername !== scopedBotUsername) {
        console.warn("❌ [WEBHOOK] Bot mismatch:", {
            tx,
            expectedBotUsername: scopedBotUsername,
            receivedBotUsername: webhookBotUsername
        });
        return res.status(400).json({ success: false, message: "Bot mismatch" });
    }

    // Agar allaqachon to'langan bo'lsa
    if (payment.status === PaymentStatus.PAID) {
        if (Number.isFinite(paymentTelegramId) && paymentTelegramId > 0) {
            const botKey = String(payment.metadata?.botKey || resolveBotKey()).trim();
            await botAccessService.markAsPaid(paymentTelegramId, scopedBotUsername, botKey);
        }

        console.log("ℹ️ [WEBHOOK] Payment already completed for tx:", tx);
        return res.json({
            success: true,
            message: "Already paid"
        });
    }

    // Amount tekshirish (phishing/amount o'zgartirishdan himoya)
    const webhookAmount = Number(amount);
    if (!Number.isFinite(webhookAmount) || webhookAmount <= 0) {
        console.warn("⚠️ [WEBHOOK] Invalid amount in webhook:", amount);
        return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    if (webhookAmount !== payment.amount) {
        console.warn("❌ [WEBHOOK] Amount mismatch:", {
            expected: payment.amount,
            received: webhookAmount,
            tx
        });

        payment.status = PaymentStatus.FAILED;
        payment.metadata = {
            ...payment.metadata,
            failedAt: new Date().toISOString(),
            failedReason: "amount_mismatch",
            webhookAmount: webhookAmount
        };
        await paymentRepo.save(payment);

        return res.status(400).json({
            success: false,
            message: "Amount mismatch"
        });
    }

    // Status tekshirish (success, paid, completed)
    const paymentSuccess = status === "success" || status === "paid" || status === "completed";

    if (paymentSuccess) {
        // Click Merchant API orqali qayta tekshirish (agar konfiguratsiya bor bo'lsa)
        try {
            console.log("🔍 [WEBHOOK] Click verify request:", {
                tx: payment.transactionParam,
                createdAt: payment.createdAt
            });
            const clickResult = await verifyClickPaymentByMTI(payment.transactionParam, payment.createdAt);
            console.log("✅ [WEBHOOK] Click verify response:", clickResult);
            if (clickResult.errorNote !== "missing_click_config") {
                if (!clickResult.ok) {
                    console.warn("❌ [WEBHOOK] Click verify failed:", clickResult);
                    payment.status = PaymentStatus.FAILED;
                    payment.metadata = {
                        ...payment.metadata,
                        failedAt: new Date().toISOString(),
                        failedReason: "click_verify_failed",
                        clickVerify: clickResult
                    };
                    await paymentRepo.save(payment);
                    return res.status(400).json({ success: false, message: "Click verify failed" });
                }

                if (clickResult.paymentStatus !== undefined && clickResult.paymentStatus !== 1) {
                    console.warn("❌ [WEBHOOK] Click payment_status not paid:", clickResult.paymentStatus);
                    payment.status = PaymentStatus.FAILED;
                    payment.metadata = {
                        ...payment.metadata,
                        failedAt: new Date().toISOString(),
                        failedReason: "click_not_paid",
                        clickVerify: clickResult
                    };
                    await paymentRepo.save(payment);
                    return res.status(400).json({ success: false, message: "Click status not paid" });
                }
            } else {
                console.warn("⚠️ [WEBHOOK] Click verify skipped: missing config");
            }
        } catch (error) {
            console.error("❌ [WEBHOOK] Click verify error:", error);
            payment.status = PaymentStatus.FAILED;
            payment.metadata = {
                ...payment.metadata,
                failedAt: new Date().toISOString(),
                failedReason: "click_verify_error"
            };
            await paymentRepo.save(payment);
            return res.status(500).json({ success: false, message: "Click verify error" });
        }

        // To'lovni tasdiqlash
        payment.status = PaymentStatus.PAID;
        payment.metadata = {
            ...payment.metadata,
            paidAt: new Date().toISOString(),
            webhookAmount: amount,
            webhookUserId: user_id,
            webhookBotUsername: bot_username,
            botUsername: scopedBotUsername
        };
        await paymentRepo.save(payment);

        // Foydalanuvchini to'lagan deb belgilash (faqat shu bot uchun)
        if (Number.isFinite(paymentTelegramId) && paymentTelegramId > 0) {
            const targetBot = await resolveTargetBot(botResolver, scopedBotUsername, payment);
            const botKey = String(payment.metadata?.botKey || resolveBotKey()).trim();
            await botAccessService.markAsPaid(paymentTelegramId, scopedBotUsername, botKey);

            console.log(`✅ [WEBHOOK] User ${paymentTelegramId} marked as paid for bot=${scopedBotUsername} (key=${botKey})`);

            // 🎉 Telegram orqali tasdiq xabari yuborish
            if (targetBot) {
                try {
                    const language = normalizeLanguage(payment.user?.preferredLanguage);
                    const messages = getMessages(language);

                    await targetBot.api.sendMessage(
                        paymentTelegramId,
                        messages.paymentConfirmedNotification(Number(payment.amount)),
                        { parse_mode: "HTML" }
                    );
                    console.log(`📤 [WEBHOOK] Notification sent to user ${paymentTelegramId} via @${scopedBotUsername}`);
                } catch (error) {
                    console.error("❌ [WEBHOOK] Failed to send notification:", error);
                }
            } else {
                console.warn(`⚠️ [WEBHOOK] Bot instance not found for @${scopedBotUsername}`);
            }
        }

        console.log("✅ [WEBHOOK] Payment completed successfully");

        return res.json({
            success: true,
            message: "Payment completed"
        });
    } else {
        // To'lov muvaffaqiyatsiz
        payment.status = PaymentStatus.FAILED;
        payment.metadata = {
            ...payment.metadata,
            failedAt: new Date().toISOString(),
            failedReason: status
        };
        await paymentRepo.save(payment);

        console.log(`❌ [WEBHOOK] Payment failed: ${status}`);

        return res.json({
            success: false,
            message: "Payment failed"
        });
    }
}
