import { MigrationInterface, QueryRunner, TableColumn, TableUnique } from "typeorm";

export class ScopeUsersAndPaymentsByBot1770500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const usersTable = await queryRunner.getTable("users");
        const paymentsTable = await queryRunner.getTable("payments");

        if (!usersTable?.findColumnByName("botUsername")) {
            await queryRunner.addColumn(
                "users",
                new TableColumn({
                    name: "botUsername",
                    type: "varchar",
                    length: "128",
                    isNullable: true
                })
            );
        }

        if (!paymentsTable?.findColumnByName("botUsername")) {
            await queryRunner.addColumn(
                "payments",
                new TableColumn({
                    name: "botUsername",
                    type: "varchar",
                    length: "128",
                    isNullable: true
                })
            );
        }

        await queryRunner.query(`
            UPDATE "users" u
            SET "botUsername" = LOWER(p."botUsername")
            FROM (
                SELECT DISTINCT ON (p."userId")
                    p."userId",
                    NULLIF(p.metadata ->> 'botUsername', '') AS "botUsername"
                FROM "payments" p
                WHERE NULLIF(p.metadata ->> 'botUsername', '') IS NOT NULL
                ORDER BY p."userId", p."createdAt" DESC
            ) p
            WHERE u.id = p."userId"
              AND (u."botUsername" IS NULL OR BTRIM(u."botUsername") = '')
        `);

        await queryRunner.query(`
            UPDATE "users" u
            SET "botUsername" = LOWER(a."botKey")
            FROM (
                SELECT DISTINCT ON (ba."userId")
                    ba."userId",
                    ba."botKey"
                FROM "bot_access" ba
                WHERE ba."botKey" ~* 'bot$'
                ORDER BY ba."userId", ba."updatedAt" DESC NULLS LAST, ba."createdAt" DESC
            ) a
            WHERE u.id = a."userId"
              AND (u."botUsername" IS NULL OR BTRIM(u."botUsername") = '')
        `);

        await queryRunner.query(`
            UPDATE "users"
            SET "botUsername" = 'legacy'
            WHERE "botUsername" IS NULL OR BTRIM("botUsername") = ''
        `);

        await queryRunner.query(`
            UPDATE "payments" p
            SET "botUsername" = LOWER(COALESCE(
                NULLIF(p.metadata ->> 'botUsername', ''),
                CASE
                    WHEN COALESCE(p.metadata ->> 'botKey', '') ~* 'bot$'
                        THEN p.metadata ->> 'botKey'
                    ELSE NULL
                END,
                u."botUsername",
                'legacy'
            ))
            FROM "users" u
            WHERE u.id = p."userId"
              AND (p."botUsername" IS NULL OR BTRIM(p."botUsername") = '')
        `);

        await queryRunner.query(`
            UPDATE "payments"
            SET "botUsername" = 'legacy'
            WHERE "botUsername" IS NULL OR BTRIM("botUsername") = ''
        `);

        await queryRunner.query(`
            UPDATE "payments"
            SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('botUsername', "botUsername")
            WHERE COALESCE(metadata ->> 'botUsername', '') <> "botUsername"
        `);

        await queryRunner.changeColumn(
            "users",
            "botUsername",
            new TableColumn({
                name: "botUsername",
                type: "varchar",
                length: "128",
                isNullable: false,
                default: "'legacy'"
            })
        );

        await queryRunner.changeColumn(
            "payments",
            "botUsername",
            new TableColumn({
                name: "botUsername",
                type: "varchar",
                length: "128",
                isNullable: false,
                default: "'legacy'"
            })
        );

        const refreshedUsersTable = await queryRunner.getTable("users");
        const legacyTelegramUnique = refreshedUsersTable?.uniques.find((unique) =>
            unique.columnNames.length === 1 && unique.columnNames[0] === "telegramId"
        );

        if (legacyTelegramUnique) {
            await queryRunner.dropUniqueConstraint("users", legacyTelegramUnique);
        }

        const scopedUniqueExists = refreshedUsersTable?.uniques.some((unique) =>
            unique.columnNames.length === 2 &&
            unique.columnNames.includes("telegramId") &&
            unique.columnNames.includes("botUsername")
        );

        if (!scopedUniqueExists) {
            await queryRunner.createUniqueConstraint(
                "users",
                new TableUnique({
                    name: "UQ_users_telegramId_botUsername",
                    columnNames: ["telegramId", "botUsername"]
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const usersTable = await queryRunner.getTable("users");
        const scopedUnique = usersTable?.uniques.find((unique) => unique.name === "UQ_users_telegramId_botUsername");

        if (scopedUnique) {
            await queryRunner.dropUniqueConstraint("users", scopedUnique);
        }

        const legacyTelegramUnique = usersTable?.uniques.find((unique) =>
            unique.columnNames.length === 1 && unique.columnNames[0] === "telegramId"
        );

        if (!legacyTelegramUnique) {
            await queryRunner.createUniqueConstraint(
                "users",
                new TableUnique({
                    name: "UQ_users_telegramId",
                    columnNames: ["telegramId"]
                })
            );
        }

        if (usersTable?.findColumnByName("botUsername")) {
            await queryRunner.dropColumn("users", "botUsername");
        }

        const paymentsTable = await queryRunner.getTable("payments");
        if (paymentsTable?.findColumnByName("botUsername")) {
            await queryRunner.dropColumn("payments", "botUsername");
        }
    }
}
