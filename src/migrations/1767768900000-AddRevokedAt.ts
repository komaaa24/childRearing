import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * ➕ Add revokedAt column to track admin revocations
 * 
 * This prevents automatic re-approval after admin revoke:
 * - When admin revokes: revokedAt = NOW()
 * - Bot checks: if revokedAt exists after latest payment → skip auto-approval
 */
export class AddRevokedAt1767768900000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("users");
        const column = table?.findColumnByName("revokedAt");

        if (!column) {
            await queryRunner.addColumn(
                "users",
                new TableColumn({
                    name: "revokedAt",
                    type: "timestamp",
                    isNullable: true,
                    default: null
                })
            );
            console.log("✅ Added revokedAt column to users table");
        } else {
            console.log("ℹ️ Column revokedAt already exists, skipping...");
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("users", "revokedAt");
        console.log("✅ Dropped revokedAt column from users table");
    }
}
