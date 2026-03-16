import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source.js";
import { BotAccess } from "../entities/BotAccess.js";
import { User } from "../entities/User.js";

export class BotAccessService {
    private accessRepo: Repository<BotAccess>;
    private userRepo: Repository<User>;

    constructor() {
        this.accessRepo = AppDataSource.getRepository(BotAccess);
        this.userRepo = AppDataSource.getRepository(User);
    }

    private async resolveUserId(telegramId: number): Promise<number | null> {
        const user = await this.userRepo.findOne({ where: { telegramId } });
        return user?.id ?? null;
    }

    async getAccess(telegramId: number, botKey: string): Promise<BotAccess | null> {
        const userId = await this.resolveUserId(telegramId);
        if (!userId) return null;
        return this.accessRepo.findOne({ where: { userId, botKey } });
    }

    async hasPaidForBot(telegramId: number, botKey: string): Promise<boolean> {
        const access = await this.getAccess(telegramId, botKey);
        return access?.hasPaid || false;
    }

    async markAsPaid(telegramId: number, botKey: string): Promise<void> {
        const userId = await this.resolveUserId(telegramId);
        if (!userId) return;

        const existing = await this.accessRepo.findOne({ where: { userId, botKey } });
        if (!existing) {
            const access = this.accessRepo.create({
                userId,
                botKey,
                hasPaid: true
            });
            await this.accessRepo.save(access);
            return;
        }

        existing.hasPaid = true;
        existing.revokedAt = null as unknown as Date | undefined;
        await this.accessRepo.save(existing);
    }

    async revoke(telegramId: number, botKey: string): Promise<void> {
        const userId = await this.resolveUserId(telegramId);
        if (!userId) return;

        const existing = await this.accessRepo.findOne({ where: { userId, botKey } });
        if (!existing) {
            const access = this.accessRepo.create({
                userId,
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
    }
}
