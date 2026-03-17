import { MigrationInterface, QueryRunner } from "typeorm";

export class SetRussianAsDefaultLanguage1767779000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "preferredLanguage" SET DEFAULT 'ru'`);
        await queryRunner.query(`UPDATE "users" SET "preferredLanguage" = 'ru' WHERE "preferredLanguage" <> 'ru'`);
        await queryRunner.query(`ALTER TABLE "jokes" ALTER COLUMN "language" SET DEFAULT 'ru'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "preferredLanguage" SET DEFAULT 'uz'`);
        await queryRunner.query(`ALTER TABLE "jokes" ALTER COLUMN "language" SET DEFAULT 'uz'`);
    }
}
