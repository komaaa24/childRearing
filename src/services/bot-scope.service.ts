import { Context } from "grammy";

export const LEGACY_BOT_USERNAME = "legacy";

export function normalizeBotUsername(value?: string | null): string {
    const normalized = (value || "")
        .trim()
        .replace(/^@/, "")
        .toLowerCase();

    return normalized || LEGACY_BOT_USERNAME;
}

export function resolveBotUsername(ctx?: Context, fallback?: string): string {
    return normalizeBotUsername(ctx?.me?.username || fallback);
}

export function resolveBotKey(ctx?: Context): string {
    const envKey = (process.env.BOT_KEY || "").trim();
    if (envKey) {
        return envKey;
    }

    return normalizeBotUsername(ctx?.me?.username || "default");
}

export function buildScopedSessionKey(telegramId: number, botUsername: string): string {
    return `${normalizeBotUsername(botUsername)}:${telegramId}`;
}

export function inferBotUsername(botUsername?: string | null, botKey?: string | null): string {
    const normalizedBotUsername = normalizeBotUsername(botUsername);
    if (normalizedBotUsername !== LEGACY_BOT_USERNAME) {
        return normalizedBotUsername;
    }

    const normalizedBotKey = normalizeBotUsername(botKey);
    if (normalizedBotKey.endsWith("bot")) {
        return normalizedBotKey;
    }

    return LEGACY_BOT_USERNAME;
}
