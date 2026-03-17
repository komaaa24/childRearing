import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class InitialSchema1736115600000 implements MigrationInterface {
    name = 'InitialSchema1736115600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.createTable(
            new Table({
                name: "users",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "telegramId",
                        type: "bigint",
                        isUnique: true,
                    },
                    {
                        name: "username",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "firstName",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "lastName",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "hasPaid",
                        type: "boolean",
                        default: false,
                    },
                    {
                        name: "viewedAnecdotes",
                        type: "int",
                        default: 0,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        // Create poems table
        await queryRunner.createTable(
            new Table({
                name: "poems",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "externalId",
                        type: "varchar",
                        isUnique: true,
                    },
                    {
                        name: "author",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "title",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "content",
                        type: "text",
                    },
                    {
                        name: "views",
                        type: "int",
                        default: 0,
                    },
                    {
                        name: "likes",
                        type: "int",
                        default: 0,
                    },
                    {
                        name: "dislikes",
                        type: "int",
                        default: 0,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        // Create index on author
        await queryRunner.query(
            `CREATE INDEX "IDX_poems_author" ON "poems" ("author")`
        );

        // Create payments table
        await queryRunner.createTable(
            new Table({
                name: "payments",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "transactionParam",
                        type: "varchar",
                        isUnique: true,
                    },
                    {
                        name: "userId",
                        type: "int",
                    },
                    {
                        name: "amount",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["pending", "paid", "failed", "cancelled"],
                        default: "'pending'",
                    },
                    {
                        name: "clickTransId",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "merchantTransId",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "metadata",
                        type: "jsonb",
                        isNullable: true,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        // Add foreign key
        await queryRunner.createForeignKey(
            "payments",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order
        await queryRunner.dropTable("payments");
        await queryRunner.dropTable("poems");
        await queryRunner.dropTable("users");
    }
}
