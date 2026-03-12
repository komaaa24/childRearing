import { BotLanguage } from "../types/language.js";

export function normalizeLanguage(_value?: string | null): BotLanguage {
    return "ru";
}

export function detectLanguageFromTelegram(_languageCode?: string | null): BotLanguage {
    return "ru";
}

type Messages = {
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
};

const RU_MESSAGES: Messages = {
    noFacts: "Советы по похудению пока не найдены 😔",
    categoryLabel: "Раздел",
    nextFactButton: "➡️ Следующий совет",
    premiumButton: "🚀 Премиум-доступ",
    payButton: "💳 Оплатить",
    checkPaymentButton: "✅ Проверить оплату",
    openFactsButton: "📖 Открыть советы",
    sessionExpired: "Сессия истекла. Нажмите /start.",
    revokedLimitAlert: "❌ Подписка не активна. Доступно только 5 бесплатных советов.",
    revokedLimitText:
        `⚠️ <b>Премиум не активен</b>\n\n` +
        `Вы можете смотреть только 5 бесплатных советов по снижению веса.\n\n` +
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
        `🚀 <b>ПРЕМИУМ СОВЕТЫ ПО ПОХУДЕНИЮ</b>\n\n` +
        `💰 Цена: <b>${amount.toLocaleString()} UZS</b>\n` +
        `♾️ Разовая оплата, безлимитный доступ.\n\n` +
        `С премиумом вы получаете:\n` +
        `• Полный каталог советов\n` +
        `• Новые рекомендации при каждом запуске\n` +
        `• Доступ без ограничений\n\n` +
        `После оплаты нажмите "Проверить оплату".`,
    paymentConfirmedNotification: (amount: number) =>
        `✅ <b>Ваш платеж подтвержден!</b>\n\n` +
        `💰 Сумма: ${amount.toLocaleString()} UZS\n` +
        `🎉 Теперь у вас безлимитный доступ к советам по похудению.\n\n` +
        `Нажмите /start, чтобы продолжить.`,
    factCardTitle: (index: number, total: number) => `🔥 <b>ПЛАН ПОХУДЕНИЯ #${index}</b> • ${total}`,
    syncStarted: "🔄 Синхронизация советов по похудению...",
    syncCompleted: "✅ Советы успешно синхронизированы",
    syncFailed: "❌ Ошибка синхронизации советов"
};

export function getMessages(_language: BotLanguage): Messages {
    return RU_MESSAGES;
}
