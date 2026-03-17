#!/usr/bin/env node

import "dotenv/config";
import { AppDataSource } from "../dist/database/data-source.js";

async function runMigrations() {
    try {
        console.log("🔄 Initializing database connection...");
        await AppDataSource.initialize();
        console.log("✅ Database connected");

        console.log("🔄 Running migrations...");
        const migrations = await AppDataSource.runMigrations();

        if (migrations.length === 0) {
            console.log("✅ No migrations to run");
        } else {
            console.log(`✅ Ran ${migrations.length} migration(s):`);
            migrations.forEach(m => console.log(`  - ${m.name}`));
        }

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigrations();
