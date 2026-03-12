import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D } from "canvas";
import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Romantik fon rasm URL
const BACKGROUND_IMAGE_URL = "https://i.imgur.com/YourImageID.jpg"; // Fallback

// Dekorativ elementlar
const decorations = ["❤️", "💝", "🌹", "✨", "💫", "🌟", "💖", "🎀", "🦋", "🌸"];

/**
 * Professional she'r rasm generatori - User rasmini fon sifatida ishlatadi
 */
export async function generatePoemImage(
    poem: string,
    author: string = "Sevgilim",
    poemNumber: number = 1
): Promise<Buffer> {
    // Canvas yaratish - HD quality
    const width = 1080;
    const height = 1350;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // User rasmini yuklab, fon qilish
    try {
        // Avval lokal rasmni yuklaymiz
        const backgroundPath = path.join(__dirname, "../../assets/background.jpg");
        const backgroundImage = await loadImage(backgroundPath);

        // Rasmni to'liq canvas bo'yicha cho'zish
        ctx.drawImage(backgroundImage, 0, 0, width, height);

        // Rasmni biroz qorongi qilish (she'r o'qilsin deb)
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fillRect(0, 0, width, height);

    } catch (error) {
        console.log("Background image not found, using gradient fallback");
        // Agar rasm topilmasa, gradient fon
        const grd = ctx.createLinearGradient(0, 0, 0, height);
        grd.addColorStop(0, "#FF6B9D");
        grd.addColorStop(1, "#C44569");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);
    }

    // Dekorativ ramka
    drawDecorativeFrame(ctx, width, height);

    // Yuqori dekorativ header
    drawHeader(ctx, width, author, poemNumber);

    // She'r matni
    drawPoemText(ctx, poem, width, height);

    // Pastki dekorativ footer
    drawFooter(ctx, width, height);

    // Dekorativ elementlar
    addDecorativeElements(ctx, width, height, poemNumber);

    // Canvas'ni buffer'ga o'girish
    return canvas.toBuffer("image/png");
}

/**
 * Texture overlay - professional look
 */
function addTextureOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 1000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? "#fff" : "#000";
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2;
        ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
}

/**
 * Dekorativ ramka
 */
function drawDecorativeFrame(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const margin = 40;

    // Tashqi ramka - gradient
    const frameGradient = ctx.createLinearGradient(0, 0, width, height);
    frameGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    frameGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
    frameGradient.addColorStop(1, "rgba(255, 255, 255, 0.3)");

    ctx.strokeStyle = frameGradient;
    ctx.lineWidth = 3;
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

    // Ichki ramka
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(margin + 10, margin + 10, width - (margin + 10) * 2, height - (margin + 10) * 2);

    // Burchak dekoratsiyalari
    drawCornerDecorations(ctx, margin, width, height);
}

/**
 * Burchak dekoratsiyalari
 */
function drawCornerDecorations(ctx: CanvasRenderingContext2D, margin: number, width: number, height: number) {
    const cornerSize = 30;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(margin + cornerSize, margin);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin, margin + cornerSize);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - margin - cornerSize, margin);
    ctx.lineTo(width - margin, margin);
    ctx.lineTo(width - margin, margin + cornerSize);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(margin, height - margin - cornerSize);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(margin + cornerSize, height - margin);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - margin - cornerSize, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.lineTo(width - margin, height - margin - cornerSize);
    ctx.stroke();
}

/**
 * Header - muallif va raqam
 */
function drawHeader(ctx: CanvasRenderingContext2D, width: number, author: string, number: number) {
    const y = 120;

    // Orqa fon - semi-transparent
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(0, y - 40, width, 100);

    // Muallif nomi
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 42px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(`👤 ${author}`, width / 2, y);

    // She'r raqami
    ctx.font = "32px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(`She'r ${number}/5`, width / 2, y + 45);

    ctx.shadowColor = "transparent";
}

/**
 * She'r matni - professional typography
 */
function drawPoemText(ctx: CanvasRenderingContext2D, poem: string, width: number, height: number) {
    const padding = 100;
    const maxWidth = width - padding * 2;
    const startY = 280;

    // Orqa fon - oq karta effekti (biroz shaffofroq)
    const cardHeight = height - startY - 250;
    const cardX = padding - 20;
    const cardY = startY - 30;
    const cardWidth = width - (padding - 20) * 2;

    // Karta shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 15;

    // Yengil shaffof oq fon (fon rasmini ko'rsatish uchun)
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.fill();

    ctx.shadowColor = "transparent";

    // She'r matni
    ctx.fillStyle = "#2C3E50";
    ctx.font = "38px Arial";
    ctx.textAlign = "center";

    const lines = poem.split("\n");
    let y = startY + 40;
    const lineHeight = 58;

    lines.forEach((line, index) => {
        if (line.trim()) {
            // Har bir qator uchun gradient text
            const textGradient = ctx.createLinearGradient(0, y, 0, y + lineHeight);
            textGradient.addColorStop(0, "#2C3E50");
            textGradient.addColorStop(1, "#34495E");
            ctx.fillStyle = textGradient;

            // Text shadow
            ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            wrapText(ctx, line, width / 2, y, maxWidth, lineHeight);
            y += lineHeight;
        } else {
            y += lineHeight * 0.5; // Bo'sh qator
        }
    });

    ctx.shadowColor = "transparent";
}

/**
 * Text wrapping - so'zlarni to'g'ri bo'lish
 */
function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
) {
    const words = text.split(" ");
    let line = "";

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + " ";
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

/**
 * Rounded rectangle
 */
function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Footer - branding
 */
function drawFooter(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const y = height - 100;

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 5;
    ctx.fillText("💝 Sevgi She'rlari", width / 2, y);

    ctx.font = "22px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("@sevgiSozlari_bot", width / 2, y + 35);

    ctx.shadowColor = "transparent";
}

/**
 * Dekorativ elementlar - yurak, yulduz va boshqalar
 */
function addDecorativeElements(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    seed: number
) {
    ctx.font = "40px Arial";

    // Yuqori dekoratsiyalar
    for (let i = 0; i < 8; i++) {
        const emoji = decorations[(seed + i) % decorations.length];
        const x = 80 + (i * (width - 160) / 7);
        const y = 50 + Math.sin(i) * 20;

        ctx.globalAlpha = 0.6;
        ctx.fillText(emoji, x, y);
    }

    // Pastki dekoratsiyalar
    for (let i = 0; i < 8; i++) {
        const emoji = decorations[(seed + i + 4) % decorations.length];
        const x = 80 + (i * (width - 160) / 7);
        const y = height - 30 + Math.cos(i) * 15;

        ctx.globalAlpha = 0.5;
        ctx.fillText(emoji, x, y);
    }

    // Yon tomonlar - floating hearts
    ctx.font = "30px Arial";
    for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.3;
        ctx.fillText("💖", 50, 200 + i * 200);
        ctx.fillText("💖", width - 80, 250 + i * 200);
    }

    ctx.globalAlpha = 1;
}

/**
 * Rasm faylini saqlash
 */
export async function savePoemImage(buffer: Buffer, filename: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, buffer);
    return filePath;
}
