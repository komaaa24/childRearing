import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * 🗑️ Remove sherlarDbChecked column - no longer needed
 * 
 * New strategy: Always check sherlar DB when hasPaid=false
 * This ensures fresh payments are detected immediately
 */
export class RemoveSherlarDbChecked1767762800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before dropping
        const table = await queryRunner.getTable("users");
        const column = table?.findColumnByName("sherlarDbChecked");

        if (column) {
            await queryRunner.dropColumn("users", "sherlarDbChecked");
            console.log("✅ Dropped sherlarDbChecked column from users table");
        } else {
            console.log("ℹ️ Column sherlarDbChecked does not exist, skipping...");
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore column if migration is reverted
        await queryRunner.addColumn(
            "users",
            new TableColumn({
                name: "sherlarDbChecked",
                type: "boolean",
                default: false,
                isNullable: false
            })
        );
        console.log("✅ Restored sherlarDbChecked column to users table");
    }
}
