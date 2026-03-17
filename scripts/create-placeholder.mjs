import { createCanvas } from "canvas";
import { writeFile } from "fs/promises";
import path from "path";

// Placeholder gradient background yaratish
async function createPlaceholder() {
    const width = 1080;
    const height = 1350;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Romantik gradient
    const grd = ctx.createLinearGradient(0, 0, 0, height);
    grd.addColorStop(0, "#FF6B9D");
    grd.addColorStop(0.5, "#FBC2EB");
    grd.addColorStop(1, "#A6C1EE");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);

    // Dekorativ pattern
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = "#fff";
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 50 + 10, 0, Math.PI * 2);
        ctx.fill();
    }

    // Hearts pattern
    ctx.font = "60px Arial";
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillText("💖", x, y);
    }

    ctx.globalAlpha = 1;

    // Save
    const outputPath = path.join(process.cwd(), "assets", "background.jpg");
    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.9 });
    await writeFile(outputPath, buffer);

    console.log("✅ Placeholder background created:", outputPath);
}

createPlaceholder().catch(console.error);
