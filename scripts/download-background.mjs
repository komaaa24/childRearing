import axios from "axios";
import { writeFile } from "fs/promises";
import path from "path";

// Rasmni URL'dan yuklab olish
async function downloadBackground() {
    try {
        const url = "https://i.postimg.cc/yx6LQnYz/romantic-background.jpg"; // Placeholder
        console.log("📥 Downloading background image...");

        const response = await axios.get(url, {
            responseType: "arraybuffer"
        });

        const outputPath = path.join(process.cwd(), "assets", "background.jpg");
        await writeFile(outputPath, response.data);

        console.log("✅ Background image saved to:", outputPath);
    } catch (error) {
        console.error("❌ Error downloading background:", error.message);
        console.log("\n📝 Manual setup:");
        console.log("1. Save your background image as: assets/background.jpg");
        console.log("2. Recommended size: 1080x1350 or larger");
    }
}

downloadBackground();
