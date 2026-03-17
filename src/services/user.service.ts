import { Repository } from "typeorm";
import { User } from "../entities/User.js";
import { AppDataSource } from "../database/data-source.js";
import { BotLanguage } from "../types/language.js";
import { normalizeLanguage } from "./i18n.service.js";
import { LEGACY_BOT_USERNAME, normalizeBotUsername } from "./bot-scope.service.js";

type UserProfileInput = {
    username?: string;
    firstName?: string;
    lastName?: string;
    preferredLanguage?: string;
};

export class UserService {
    private userRepo: Repository<User>;

    constructor() {
        this.userRepo = AppDataSource.getRepository(User);
    }

    private async findLegacyUser(telegramId: number): Promise<User | null> {
        return this.userRepo.findOne({
            where: {
                telegramId,
                botUsername: LEGACY_BOT_USERNAME
            }
        });
    }

    private async findScopedUserEntity(
        telegramId: number,
        botUsername: string,
        options?: { migrateLegacy?: boolean }
    ): Promise<User | null> {
        const normalizedBotUsername = normalizeBotUsername(botUsername);

        const scopedUser = await this.userRepo.findOne({
            where: {
                telegramId,
                botUsername: normalizedBotUsername
            }
        });

        if (scopedUser) {
            return scopedUser;
        }

        const legacyUser = await this.findLegacyUser(telegramId);
        if (!legacyUser) {
            return null;
        }

        if (options?.migrateLegacy === false || normalizedBotUsername === LEGACY_BOT_USERNAME) {
            return legacyUser;
        }

        const existingScopedUser = await this.userRepo.findOne({
            where: {
                telegramId,
                botUsername: normalizedBotUsername
            }
        });

        if (existingScopedUser) {
            return existingScopedUser;
        }

        legacyUser.botUsername = normalizedBotUsername;
        return this.userRepo.save(legacyUser);
    }

    async findByTelegramId(telegramId: number, botUsername: string): Promise<User | null> {
        return this.findScopedUserEntity(telegramId, botUsername);
    }

    /**
     * Foydalanuvchini topish yoki yaratish
     */
    async findOrCreate(telegramId: number, botUsername: string, userData?: UserProfileInput): Promise<User> {
        const normalizedBotUsername = normalizeBotUsername(botUsername);
        let user = await this.findScopedUserEntity(telegramId, normalizedBotUsername);

        const fallbackLanguage = normalizeLanguage(userData?.preferredLanguage);

        if (!user) {
            user = this.userRepo.create({
                telegramId,
                botUsername: normalizedBotUsername,
                username: userData?.username,
                firstName: userData?.firstName,
                lastName: userData?.lastName,
                preferredLanguage: fallbackLanguage
            });
            await this.userRepo.save(user);
        } else if (userData) {
            const nextUsername = userData.username || user.username;
            const nextFirstName = userData.firstName || user.firstName;
            const nextLastName = userData.lastName || user.lastName;
            const nextLanguage = normalizeLanguage(userData.preferredLanguage || user.preferredLanguage || fallbackLanguage);

            const hasChanges =
                nextUsername !== user.username ||
                nextFirstName !== user.firstName ||
                nextLastName !== user.lastName ||
                nextLanguage !== user.preferredLanguage;

            if (hasChanges) {
                user.username = nextUsername;
                user.firstName = nextFirstName;
                user.lastName = nextLastName;
                user.preferredLanguage = nextLanguage;
                await this.userRepo.save(user);
            }
        }

        if (!user) {
            throw new Error(`Failed to resolve user ${telegramId}:${normalizedBotUsername}`);
        }

        return user;
    }

    /**
     * Foydalanuvchi to'lov qildimi?
     */
    async hasPaid(telegramId: number, botUsername: string): Promise<boolean> {
        const user = await this.userRepo.findOne({
            where: {
                telegramId,
                botUsername: normalizeBotUsername(botUsername)
            }
        });
        return user?.hasPaid || false;
    }

    /**
     * Foydalanuvchini to'lagan deb belgilash
     */
    async markAsPaid(telegramId: number, botUsername: string): Promise<void> {
        const user = await this.findOrCreate(telegramId, botUsername);
        user.hasPaid = true;
        await this.userRepo.save(user);
    }

    /**
     * Foydalanuvchi ma'lumotlarini yangilash
     */
    async update(telegramId: number, botUsername: string, data: Partial<User>): Promise<void> {
        const user = await this.findScopedUserEntity(telegramId, botUsername);
        if (!user) {
            return;
        }

        Object.assign(user, data);
        if (data.preferredLanguage) {
            user.preferredLanguage = normalizeLanguage(data.preferredLanguage);
        }

        await this.userRepo.save(user);
    }

    /**
     * Ko'rilgan g'oyalar sonini oshirish
     */
    async incrementViewedJokes(telegramId: number, botUsername: string): Promise<void> {
        const user = await this.findOrCreate(telegramId, botUsername);
        user.viewedJokes += 1;
        await this.userRepo.save(user);
    }

    async getPreferredLanguage(telegramId: number, botUsername: string): Promise<BotLanguage> {
        const user = await this.findScopedUserEntity(telegramId, botUsername);

        return normalizeLanguage(user?.preferredLanguage);
    }

    async setPreferredLanguage(telegramId: number, botUsername: string, language: BotLanguage): Promise<void> {
        const user = await this.findOrCreate(telegramId, botUsername, {
            preferredLanguage: language
        });

        user.preferredLanguage = normalizeLanguage(language);
        await this.userRepo.save(user);
    }
}
