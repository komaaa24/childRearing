import { Context, InlineKeyboard } from "grammy";
import { Joke } from "../entities/Joke.js";
import { User } from "../entities/User.js";
import { Payment, PaymentStatus } from "../entities/Payment.js";
import { AppDataSource } from "../database/data-source.js";
import { UserService } from "../services/user.service.js";
import { BotAccessService } from "../services/bot-access.service.js";
import { fetchFactsFromAPI, formatJoke, resolveProgramsoftPageLimit } from "../services/joke.service.js";
import { generatePaymentLink, generateTransactionParam, getFixedPaymentAmount } from "../services/click.service.js";
import { writeFile } from "fs/promises";
import path from "path";
import axios from "axios";
import { SherlarPaymentService } from "../services/sherlar-payment.service.js";
import { BotLanguage } from "../types/language.js";
import { detectLanguageFromTelegram, getMessages, normalizeLanguage, SUPPORTED_LANGUAGES } from "../services/i18n.service.js";

const userService = new UserService();
const botAccessService = new BotAccessService();
const sherlarPaymentService = new SherlarPaymentService();

interface UserSession {
    jokes: Joke[];
    currentIndex: number;
    language: BotLanguage;
}

const sessions = new Map<number, UserSession>();
const languageSyncRetryAt = new Map<BotLanguage, number>();
const SYNC_RETRY_COOLDOWN_MS = Number(process.env.SYNC_RETRY_COOLDOWN_MS || 180000);

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function answerCallbackSafe(
    ctx: Context,
    options?: Parameters<Context["answerCallbackQuery"]>[0]
): Promise<void> {
    if (!ctx.callbackQuery) return;

    try {
        await ctx.answerCallbackQuery(options);
    } catch (error) {
        console.warn("⚠️ Failed to answer callback query:", error);
    }
}


function resolveBotKey(ctx?: Context): string {
    const envKey = (process.env.BOT_KEY || "").trim();
    if (envKey) return envKey;
    return (ctx?.me?.username || "default").trim();
}

async function resolveUserLanguage(ctx: Context, userId: number): Promise<BotLanguage> {
    const detectedLanguage = detectLanguageFromTelegram(ctx.from?.language_code);
    const existingUser = await userService.findByTelegramId(userId);
    const resolvedLanguage = normalizeLanguage(existingUser?.preferredLanguage || detectedLanguage);

    await userService.findOrCreate(userId, {
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
        lastName: ctx.from?.last_name,
        // Keep user's selected language. Telegram UI language is only a fallback for brand new users.
        preferredLanguage: resolvedLanguage
    });

    return resolvedLanguage;
}

function getLanguageKeyboard(currentLanguage: BotLanguage): InlineKeyboard {
    return new InlineKeyboard()
        .text(`🇬🇧 English${currentLanguage === "en" ? " ✅" : ""}`, "set_lang:en")
        .text(`🇷🇺 Русский${currentLanguage === "ru" ? " ✅" : ""}`, "set_lang:ru");
}

export async function handleLanguageMenu(ctx: Context, options?: { answerCallback?: boolean }) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const language = await resolveUserLanguage(ctx, userId);
    const messages = getMessages(language);
    const keyboard = getLanguageKeyboard(language);

    if (ctx.callbackQuery) {
        await ctx.editMessageText(messages.languagePrompt, {
            reply_markup: keyboard
        });

        if (options?.answerCallback !== false) {
            await answerCallbackSafe(ctx);
        }
        return;
    }

    await ctx.reply(messages.languagePrompt, {
        reply_markup: keyboard
    });
}

export async function handleSetLanguage(ctx: Context, language: BotLanguage) {
    const userId = ctx.from?.id;
    if (!userId) return;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
        await answerCallbackSafe(ctx, {
            text: "Unsupported language",
            show_alert: true
        });
        return;
    }

    await userService.setPreferredLanguage(userId, language);

    const session = sessions.get(userId);
    if (session) {
        session.language = language;
        session.currentIndex = 0;
    }

    const messages = getMessages(language);
    await answerCallbackSafe(ctx, {
        text: messages.languageUpdated,
        show_alert: false
    });

    await handleShowJokes(ctx, { answerCallback: false });
}

async function showJoke(ctx: Context, userId: number, index: number, answerCallback = false) {
    const session = sessions.get(userId);
    if (!session) return;

    if (index < 0 || index >= session.jokes.length) {
        return;
    }

    session.currentIndex = index;

    const joke = session.jokes[index];
    const total = session.jokes.length;
    const botKey = resolveBotKey(ctx);
    const hasPaid = await botAccessService.hasPaidForBot(userId, botKey);
    const messages = getMessages(session.language);

    await userService.incrementViewedJokes(userId);

    const jokeRepo = AppDataSource.getRepository(Joke);
    joke.views += 1;
    await jokeRepo.save(joke);

    const keyboard = new InlineKeyboard();

    if (index < total - 1) {
        keyboard.text(messages.nextFactButton, `next:${index + 1}`);
    }

    if (!hasPaid && index === total - 1) {
        keyboard.row();
        keyboard.text(messages.premiumButton, "payment");
    }

    keyboard.row();
    keyboard.text(messages.languageMenuButton, "language_menu");

    let text = `${messages.factCardTitle(index + 1, total)}\n\n`;

    if (joke.title) {
        text += `🎯 <b>${escapeHtml(joke.title.trim())}</b>\n\n`;
    }

    text += `💡 ${escapeHtml(joke.content.trim())}\n\n`;
    text += `<i>${escapeHtml(messages.tipFooter)}</i>\n`;

    if (joke.views > 10) {
        text += `\n👁 ${joke.views.toLocaleString()} | `;
        text += `👍 ${joke.likes} | `;
        text += `👎 ${joke.dislikes}`;
    }

    if (ctx.callbackQuery) {
        await ctx.editMessageText(text, {
            reply_markup: keyboard,
            parse_mode: "HTML"
        });

        if (answerCallback) {
            await answerCallbackSafe(ctx);
        }
    } else {
        await ctx.reply(text, {
            reply_markup: keyboard,
            parse_mode: "HTML"
        });
    }
}

/**
 * /start komandasi
 */
export async function handleStart(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const existingUser = await userService.findByTelegramId(userId);
    const detectedLanguage = detectLanguageFromTelegram(ctx.from?.language_code);

    if (!existingUser) {
        await userService.findOrCreate(userId, {
            username: ctx.from?.username,
            firstName: ctx.from?.first_name,
            lastName: ctx.from?.last_name,
            preferredLanguage: detectedLanguage
        });

        await handleLanguageMenu(ctx, { answerCallback: Boolean(ctx.callbackQuery) });
        return;
    }

    const language = normalizeLanguage(existingUser.preferredLanguage || detectedLanguage);

    await userService.findOrCreate(userId, {
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
        lastName: ctx.from?.last_name,
        preferredLanguage: language
    });

    const botKey = resolveBotKey(ctx);
    let hasPaid = await botAccessService.hasPaidForBot(userId, botKey);
    const sherlarEnabled = (process.env.ENABLE_SHERLAR_CHECK || "false").toLowerCase() === "true";

    if (!hasPaid && sherlarEnabled) {
        console.log(`🔍 [START] Checking sherlar database for user: ${userId}`);
        try {
            const paymentResult = await sherlarPaymentService.hasValidPayment(userId);

            if (paymentResult.hasPaid) {
                const access = await botAccessService.getAccess(userId, botKey);
                if (access?.revokedAt && paymentResult.paymentDate && paymentResult.paymentDate < access.revokedAt) {
                    console.log("⚠️ [START] Payment found but user was revoked for this bot. Skipping.");
                } else {
                    console.log(`✅ [START] Payment verified in sherlar DB for user: ${userId}`);
                    await botAccessService.markAsPaid(userId, botKey);
                    hasPaid = true;
                }
            } else {
                console.log(`ℹ️ [START] No payment found in sherlar DB for user: ${userId}`);
            }
        } catch (error) {
            console.error("❌ [START] Sherlar DB check error:", error);
        }
    }

    await handleShowJokes(ctx, { answerCallback: Boolean(ctx.callbackQuery) });
}

/**
 * Faktlarni ko'rsatish
 */
export async function handleShowJokes(
    ctx: Context,
    options?: { answerCallback?: boolean }
) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const language = await resolveUserLanguage(ctx, userId);
    const messages = getMessages(language);
    const jokeRepo = AppDataSource.getRepository(Joke);
    const botKey = resolveBotKey(ctx);

    const hasPaid = await botAccessService.hasPaidForBot(userId, botKey);

    const languageCount = await jokeRepo.count({
        where: { language }
    });

    let syncFailed = false;

    if (languageCount === 0) {
        const now = Date.now();
        const retryAt = languageSyncRetryAt.get(language) || 0;

        if (now >= retryAt) {
            try {
                await syncJokesFromAPI([language]);
                languageSyncRetryAt.delete(language);
            } catch (error) {
                syncFailed = true;
                languageSyncRetryAt.set(language, now + SYNC_RETRY_COOLDOWN_MS);
                console.warn("⚠️ Sync failed for language=%s. Cooldown enabled.", language, error);
            }
        } else {
            syncFailed = true;
        }
    }

    let query = jokeRepo
        .createQueryBuilder("joke")
        .where("joke.language = :language", { language })
        .orderBy("RANDOM()");

    if (!hasPaid) {
        query = query.limit(5);
    }

    const jokes = await query.getMany();

    if (jokes.length === 0) {
        const emptyStateText = syncFailed ? messages.syncFailed : messages.noFacts;

        if (ctx.callbackQuery) {
            await answerCallbackSafe(ctx, {
                text: emptyStateText,
                show_alert: true
            });
        } else {
            await ctx.reply(emptyStateText);
        }
        return;
    }

    sessions.set(userId, {
        jokes,
        currentIndex: 0,
        language
    });

    const shouldAnswerCallback =
        options?.answerCallback !== undefined ? options.answerCallback : Boolean(ctx.callbackQuery);

    await showJoke(ctx, userId, 0, shouldAnswerCallback);
}

/**
 * Keyingi fakt
 */
export async function handleNext(ctx: Context, index: number) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const botKey = resolveBotKey(ctx);
    const hasPaid = await botAccessService.hasPaidForBot(userId, botKey);
    const session = sessions.get(userId);
    const language = session?.language || (await resolveUserLanguage(ctx, userId));
    const messages = getMessages(language);

    if (!session) {
        await answerCallbackSafe(ctx, {
            text: messages.sessionExpired,
            show_alert: true
        });
        return;
    }

    if (!hasPaid && index >= 5) {
        await answerCallbackSafe(ctx, {
            text: messages.revokedLimitAlert,
            show_alert: true
        });

        const keyboard = new InlineKeyboard()
            .text(messages.premiumButton, "payment");

        await ctx.editMessageText(messages.revokedLimitText, {
            reply_markup: keyboard,
            parse_mode: "HTML"
        });
        return;
    }

    await showJoke(ctx, userId, index, true);
}

/**
 * To'lov oynasi
 */
export async function handlePayment(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const language = await resolveUserLanguage(ctx, userId);
    const messages = getMessages(language);
    const botKey = resolveBotKey(ctx);

    const user = await userService.findOrCreate(userId, {
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
        lastName: ctx.from?.last_name,
        preferredLanguage: language
    });

    const alreadyPaid = await botAccessService.hasPaidForBot(userId, botKey);

    if (alreadyPaid) {
        await answerCallbackSafe(ctx, {
            text: messages.alreadyPremium,
            show_alert: true
        });
        return;
    }

    const amount = getFixedPaymentAmount();
    const transactionParam = generateTransactionParam();

    const paymentRepo = AppDataSource.getRepository(Payment);
    const payment = paymentRepo.create({
        transactionParam,
        userId: user.id,
        amount,
        status: PaymentStatus.PENDING,
        metadata: {
            telegramId: userId,
            username: ctx.from?.username,
            botKey
        }
    });
    await paymentRepo.save(payment);

    const botUsername = ctx.me?.username || "faktlar_bot";
    const returnUrl = `https://t.me/${botUsername}`;

    const paymentLink = generatePaymentLink({
        amount,
        transactionParam,
        userId,
        returnUrl
    });

    const keyboard = new InlineKeyboard()
        .url(messages.payButton, paymentLink.url)
        .row()
        .text(messages.checkPaymentButton, `check_payment:${payment.id}`);

    if (ctx.callbackQuery) {
        await ctx.editMessageText(messages.paymentScreen(amount), {
            reply_markup: keyboard,
            parse_mode: "HTML"
        });
        await answerCallbackSafe(ctx);
    } else {
        await ctx.reply(messages.paymentScreen(amount), {
            reply_markup: keyboard,
            parse_mode: "HTML"
        });
    }
}

/**
 * To'lovni tekshirish
 */
export async function handleCheckPayment(ctx: Context, paymentId: number) {
    const userId = ctx.from?.id;
    if (!userId) return;

    const language = await resolveUserLanguage(ctx, userId);
    const messages = getMessages(language);
    const botKey = resolveBotKey(ctx);

    const paymentRepo = AppDataSource.getRepository(Payment);
    const payment = await paymentRepo.findOne({
        where: { id: paymentId },
        relations: ["user"]
    });

    if (!payment || (payment.metadata?.botKey && payment.metadata.botKey !== botKey)) {
        await answerCallbackSafe(ctx, {
            text: messages.paymentNotFound,
            show_alert: true
        });
        return;
    }

    if (payment.status === PaymentStatus.PAID) {
        await answerCallbackSafe(ctx, {
            text: messages.paymentApprovedAlert,
            show_alert: true
        });

        await ctx.editMessageText(messages.paymentApprovedText(Number(payment.amount)), {
            parse_mode: "HTML"
        });
        return;
    }

    if (payment.status === PaymentStatus.PENDING) {
        await answerCallbackSafe(ctx, {
            text: messages.paymentChecking,
            show_alert: false
        });

        try {
            const sherlarEnabled = (process.env.ENABLE_SHERLAR_CHECK || "false").toLowerCase() === "true";
            if (!sherlarEnabled) {
                await ctx.editMessageText(messages.paymentPending, {
                    parse_mode: "HTML"
                });
                return;
            }

            const paymentResult = await sherlarPaymentService.hasValidPayment(userId);

            if (paymentResult.hasPaid) {
                const access = await botAccessService.getAccess(userId, botKey);
                if (access?.revokedAt && paymentResult.paymentDate && paymentResult.paymentDate < access.revokedAt) {
                    await ctx.editMessageText(messages.paymentRevokedText, {
                        parse_mode: "HTML"
                    });
                    return;
                }

                payment.status = PaymentStatus.PAID;
                await paymentRepo.save(payment);
                await botAccessService.markAsPaid(userId, botKey);

                await ctx.editMessageText(messages.paymentApprovedText(Number(payment.amount)), {
                    parse_mode: "HTML"
                });
            } else {
                await ctx.editMessageText(messages.paymentPending, {
                    parse_mode: "HTML"
                });
            }
        } catch (error) {
            console.error("❌ [CHECK_PAYMENT] Error:", error);
            await ctx.editMessageText(messages.paymentError, {
                parse_mode: "HTML"
            });
        }
        return;
    }

    await answerCallbackSafe(ctx, {
        text: messages.paymentFailed,
        show_alert: true
    });
}

/**
 * API dan faktlarni sinxronlash
 */
export async function syncJokesFromAPI(languages: BotLanguage[] = SUPPORTED_LANGUAGES): Promise<void> {
    const jokeRepo = AppDataSource.getRepository(Joke);

    try {
        for (const language of languages) {
            const pageLimit = resolveProgramsoftPageLimit(language);
            let page = 1;
            let synced = 0;

            while (page <= pageLimit) {
                const result = await fetchFactsFromAPI(language, page);
                if (result.items.length === 0) {
                    break;
                }

                const rows = result.items.map((item) => formatJoke(item, language));
                await jokeRepo.upsert(rows, ["externalId"]);
                synced += rows.length;

                if (result.lastPage && page >= result.lastPage) {
                    break;
                }

                page += 1;
            }

            console.log(`✅ Synced ${synced} facts for language=${language}`);
        }

        console.log("✅ Content synced successfully");
    } catch (error) {
        console.error("❌ Error syncing facts:", error);
        throw error;
    }
}

/**
 * Admin: Fon rasmini yuklash
 */
export async function handleUploadBackground(ctx: Context) {
    const userId = ctx.from?.id;
    const adminId = Number(process.env.ADMIN_ID) || 7789445876;

    if (userId !== adminId) {
        await ctx.reply("❌ Эта команда доступна только админу!");
        return;
    }

    const photo = ctx.message?.photo;
    if (!photo || photo.length === 0) {
        await ctx.reply("❌ Пожалуйста, отправьте изображение!");
        return;
    }

    try {
        const largestPhoto = photo[photo.length - 1];
        const file = await ctx.api.getFile(largestPhoto.file_id);

        if (!file.file_path) {
            throw new Error("File path not found");
        }

        const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;
        const response = await axios.get(fileUrl, {
            responseType: "arraybuffer"
        });

        const backgroundPath = path.join(process.cwd(), "assets", "background.jpg");
        await writeFile(backgroundPath, response.data);

        await ctx.reply(
            "✅ <b>Фоновое изображение обновлено!</b>\n\n" +
            "📁 Файл: assets/background.jpg\n" +
            "📏 Размер: " + (response.data.byteLength / 1024).toFixed(2) + " KB",
            { parse_mode: "HTML" }
        );
    } catch (error) {
        console.error("Error uploading background:", error);
        await ctx.reply("❌ Произошла ошибка");
    }
}
