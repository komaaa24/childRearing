import { BotLanguage } from "../types/language.js";

export const SUPPORTED_LANGUAGES: BotLanguage[] = ["en", "ru"];

export function normalizeLanguage(value?: string | null): BotLanguage {
    const normalized = (value || "").trim().toLowerCase();

    if (normalized.startsWith("en")) {
        return "en";
    }

    if (normalized.startsWith("ru")) {
        return "ru";
    }

    return "ru";
}

export function detectLanguageFromTelegram(languageCode?: string | null): BotLanguage {
    return normalizeLanguage(languageCode);
}

export type Messages = {
    noFacts: string;
    categoryLabel: string;
    nextFactButton: string;
    premiumButton: string;
    payButton: string;
    checkPaymentButton: string;
    openFactsButton: string;
    sessionExpired: string;
    revokedLimitAlert: string;
    revokedLimitText: string;
    alreadyPremium: string;
    paymentNotFound: string;
    paymentChecking: string;
    paymentPending: string;
    paymentError: string;
    paymentFailed: string;
    paymentCancelled: string;
    paymentApprovedAlert: string;
    paymentApprovedText: (amount: number) => string;
    paymentRevokedText: string;
    paymentScreen: (amount: number) => string;
    paymentConfirmedNotification: (amount: number) => string;
    factCardTitle: (index: number, total: number) => string;
    syncStarted: string;
    syncCompleted: string;
    syncFailed: string;
    tipFooter: string;
    chooseLanguage: string;
    languageUpdated: string;
    languageMenuButton: string;
    languagePrompt: string;
    processingError: string;
};

const EN_MESSAGES: Messages = {
    noFacts: "Parenting tips are not available yet 😔",
    categoryLabel: "Category",
    nextFactButton: "➡️ Next tip",
    premiumButton: "🚀 Premium access",
    payButton: "💳 Pay",
    checkPaymentButton: "✅ Check payment",
    openFactsButton: "📖 Open tips",
    sessionExpired: "Session expired. Press /start.",
    revokedLimitAlert: "❌ Subscription inactive. Only 5 free tips are available.",
    revokedLimitText:
        `⚠️ <b>Premium is inactive</b>\n\n` +
        `You can read only 5 free parenting tips.\n\n` +
        `Activate premium for full access.`,
    alreadyPremium: "You already have premium ✅",
    paymentNotFound: "Payment not found ❌",
    paymentChecking: "🔍 Checking payment...",
    paymentPending:
        `⏳ <b>Payment is still pending</b>\n\n` +
        `Please wait a bit and check again.`,
    paymentError:
        `❌ <b>An error occurred</b>\n\n` +
        `Please try again.`,
    paymentFailed: "Payment failed ❌",
    paymentCancelled: "❌ Payment cancelled.\n\nPress /start to try again.",
    paymentApprovedAlert: "Your payment is confirmed ✅",
    paymentApprovedText: (amount: number) =>
        `✅ <b>Payment confirmed!</b>\n\n` +
        `💰 Amount: ${amount.toLocaleString()} UZS\n` +
        `🎉 Premium parenting tips are now active.\n\n` +
        `Press /start to continue.`,
    paymentRevokedText:
        `⚠️ <b>Your subscription was revoked</b>\n\n` +
        `Please pay again to reactivate premium access.\n\n` +
        `/start`,
    paymentScreen: (amount: number) =>
        `🚀 <b>PREMIUM PARENTING TIPS</b>\n\n` +
        `💰 Price: <b>${amount.toLocaleString()} UZS</b>\n` +
        `♾️ One-time payment, unlimited access.\n\n` +
        `With premium you get:\n` +
        `• Full parenting tips library\n` +
        `• Fresh recommendations on every launch\n` +
        `• Unlimited access\n\n` +
        `After payment, press \"Check payment\".`,
    paymentConfirmedNotification: (amount: number) =>
        `✅ <b>Your payment is confirmed!</b>\n\n` +
        `💰 Amount: ${amount.toLocaleString()} UZS\n` +
        `🎉 You now have unlimited access to parenting tips.\n\n` +
        `Press /start to continue.`,
    factCardTitle: (index: number, total: number) => `👨‍👩‍👧 <b>PARENTING TIP #${index}</b> • ${total}`,
    syncStarted: "🔄 Syncing parenting tips...",
    syncCompleted: "✅ Parenting tips synced successfully",
    syncFailed: "❌ Failed to sync parenting tips",
    tipFooter: "Save this tip and try it with your child today.",
    chooseLanguage: "Choose your language / Выберите язык",
    languageUpdated: "✅ Language updated",
    languageMenuButton: "🌐 Language",
    languagePrompt: "Choose the bot language:",
    processingError: "❌ Something went wrong. Please try again."
};

const RU_MESSAGES: Messages = {
    noFacts: "Советы по воспитанию пока не найдены 😔",
    categoryLabel: "Категория",
    nextFactButton: "➡️ Следующий совет",
    premiumButton: "🚀 Премиум-доступ",
    payButton: "💳 Оплатить",
    checkPaymentButton: "✅ Проверить оплату",
    openFactsButton: "📖 Открыть советы",
    sessionExpired: "Сессия истекла. Нажмите /start.",
    revokedLimitAlert: "❌ Подписка не активна. Доступно только 5 бесплатных советов.",
    revokedLimitText:
        `⚠️ <b>Премиум не активен</b>\n\n` +
        `Вы можете читать только 5 бесплатных советов по воспитанию детей.\n\n` +
        `Активируйте премиум для полного доступа.`,
    alreadyPremium: "У вас уже есть премиум ✅",
    paymentNotFound: "Платеж не найден ❌",
    paymentChecking: "🔍 Проверяем оплату...",
    paymentPending:
        `⏳ <b>Оплата пока не подтверждена</b>\n\n` +
        `Подождите немного и проверьте снова.`,
    paymentError:
        `❌ <b>Произошла ошибка</b>\n\n` +
        `Пожалуйста, попробуйте снова.`,
    paymentFailed: "Оплата не прошла ❌",
    paymentCancelled: "❌ Оплата отменена.\n\nНажмите /start, чтобы попробовать снова.",
    paymentApprovedAlert: "Ваш платеж подтвержден ✅",
    paymentApprovedText: (amount: number) =>
        `✅ <b>Оплата подтверждена!</b>\n\n` +
        `💰 Сумма: ${amount.toLocaleString()} UZS\n` +
        `🎉 Премиум-доступ к советам активирован.\n\n` +
        `Нажмите /start для продолжения.`,
    paymentRevokedText:
        `⚠️ <b>Подписка была отозвана</b>\n\n` +
        `Оплатите заново, чтобы снова активировать премиум.\n\n` +
        `/start`,
    paymentScreen: (amount: number) =>
        `🚀 <b>ПРЕМИУМ СОВЕТЫ ПО ВОСПИТАНИЮ</b>\n\n` +
        `💰 Цена: <b>${amount.toLocaleString()} UZS</b>\n` +
        `♾️ Разовая оплата, безлимитный доступ.\n\n` +
        `С премиумом вы получаете:\n` +
        `• Полный каталог советов\n` +
        `• Новые рекомендации при каждом запуске\n` +
        `• Доступ без ограничений\n\n` +
        `После оплаты нажмите \"Проверить оплату\".`,
    paymentConfirmedNotification: (amount: number) =>
        `✅ <b>Ваш платеж подтвержден!</b>\n\n` +
        `💰 Сумма: ${amount.toLocaleString()} UZS\n` +
        `🎉 Теперь у вас безлимитный доступ к советам по воспитанию детей.\n\n` +
        `Нажмите /start, чтобы продолжить.`,
    factCardTitle: (index: number, total: number) => `👨‍👩‍👧 <b>СОВЕТ ПО ВОСПИТАНИЮ #${index}</b> • ${total}`,
    syncStarted: "🔄 Синхронизация советов по воспитанию...",
    syncCompleted: "✅ Советы успешно синхронизированы",
    syncFailed: "❌ Ошибка синхронизации советов",
    tipFooter: "Сохраните этот совет и примените его сегодня.",
    chooseLanguage: "Выберите язык / Choose your language",
    languageUpdated: "✅ Язык обновлен",
    languageMenuButton: "🌐 Язык",
    languagePrompt: "Выберите язык бота:",
    processingError: "❌ Произошла ошибка. Пожалуйста, попробуйте снова."
};

const MESSAGES_BY_LANGUAGE: Record<BotLanguage, Messages> = {
    en: EN_MESSAGES,
    ru: RU_MESSAGES
};

export function getMessages(language: BotLanguage): Messages {
    return MESSAGES_BY_LANGUAGE[normalizeLanguage(language)];
}
