import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class AddBotAccess1769991000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable("bot_access");
        if (!hasTable) {
            await queryRunner.createTable(
                new Table({
                    name: "bot_access",
                    columns: [
                        {
                            name: "id",
                            type: "int",
                            isPrimary: true,
                            isGenerated: true,
                            generationStrategy: "increment"
                        },
                        {
                            name: "userId",
                            type: "int",
                            isNullable: false
                        },
                        {
                            name: "botKey",
                            type: "varchar",
                            length: "128",
                            isNullable: false
                        },
                        {
                            name: "hasPaid",
                            type: "boolean",
                            default: false
                        },
                        {
                            name: "revokedAt",
                            type: "timestamp",
                            isNullable: true
                        },
                        {
                            name: "createdAt",
                            type: "timestamp",
                            default: "now()"
                        },
                        {
                            name: "updatedAt",
                            type: "timestamp",
                            default: "now()"
                        }
                    ]
                })
            );

            await queryRunner.createIndex(
                "bot_access",
                new TableIndex({
                    name: "IDX_bot_access_user_bot",
                    columnNames: ["userId", "botKey"],
                    isUnique: true
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable("bot_access");
        if (hasTable) {
            await queryRunner.dropTable("bot_access");
        }
    }
}
