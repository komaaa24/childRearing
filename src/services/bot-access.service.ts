import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source.js";
import { BotAccess } from "../entities/BotAccess.js";
import { User } from "../entities/User.js";
import { LEGACY_BOT_USERNAME, normalizeBotUsername } from "./bot-scope.service.js";

export class BotAccessService {
    private accessRepo: Repository<BotAccess>;
    private userRepo: Repository<User>;

    constructor() {
        this.accessRepo = AppDataSource.getRepository(BotAccess);
        this.userRepo = AppDataSource.getRepository(User);
    }

    private async resolveUser(telegramId: number, botUsername: string): Promise<User | null> {
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

        const legacyUser = await this.userRepo.findOne({
            where: {
                telegramId,
                botUsername: LEGACY_BOT_USERNAME
            }
        });

        if (!legacyUser || normalizedBotUsername === LEGACY_BOT_USERNAME) {
            return legacyUser;
        }

        legacyUser.botUsername = normalizedBotUsername;
        return this.userRepo.save(legacyUser);
    }

    async getAccess(telegramId: number, botUsername: string, botKey: string): Promise<BotAccess | null> {
        const user = await this.resolveUser(telegramId, botUsername);
        if (!user) return null;
        return this.accessRepo.findOne({ where: { userId: user.id, botKey } });
    }

    async hasPaidForBot(telegramId: number, botUsername: string, botKey: string): Promise<boolean> {
        const access = await this.getAccess(telegramId, botUsername, botKey);
        return access?.hasPaid || false;
    }

    async markAsPaid(telegramId: number, botUsername: string, botKey: string): Promise<void> {
        const user = await this.resolveUser(telegramId, botUsername);
        if (!user) return;

        const existing = await this.accessRepo.findOne({ where: { userId: user.id, botKey } });
        if (!existing) {
            const access = this.accessRepo.create({
                userId: user.id,
                botKey,
                hasPaid: true
            });
            await this.accessRepo.save(access);
        } else {
            existing.hasPaid = true;
            existing.revokedAt = null as unknown as Date | undefined;
            await this.accessRepo.save(existing);
        }

        user.hasPaid = true;
        await this.userRepo.save(user);
    }

    async revoke(telegramId: number, botUsername: string, botKey: string): Promise<void> {
        const user = await this.resolveUser(telegramId, botUsername);
        if (!user) return;

        const existing = await this.accessRepo.findOne({ where: { userId: user.id, botKey } });
        if (!existing) {
            const access = this.accessRepo.create({
                userId: user.id,
                botKey,
                hasPaid: false,
                revokedAt: new Date()
            });
            await this.accessRepo.save(access);
            return;
        }

        existing.hasPaid = false;
        existing.revokedAt = new Date();
        await this.accessRepo.save(existing);

        user.hasPaid = false;
        await this.userRepo.save(user);
    }
}
