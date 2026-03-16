# 👨‍👩‍👧 Parenting Tips Telegram Bot (EN/RU)

Telegram bot with Click payment integration for child-rearing tips in **English** and **Russian**.

## Features

- 🌐 Two languages: `English` + `Russian`
- 👶 Child-rearing / parenting recommendations from ProgramSoft API
- 🔁 Auto-sync from ProgramSoft API by language
- 💳 Click payment flow for premium access
- 🆓 5 free tips for non-paid users
- ♾️ Unlimited tips for premium users
- 📊 Basic analytics and admin tooling

## Stack

- Node.js + TypeScript
- Grammy (Telegram Bot API framework)
- PostgreSQL + TypeORM
- Click.uz payment integration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create env file:
```bash
cp .env.example .env
```

3. Fill required variables in `.env`:

```env
BOT_TOKEN=...

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=...
DB_NAME=child_rears

PROGRAMSOFT_API_URL=http://www.programsoft.uz/api
PROGRAMSOFT_EN_SERVICE_ID=76
PROGRAMSOFT_RU_SERVICE_ID=138
PROGRAMSOFT_EN_PAGES=30
PROGRAMSOFT_RU_PAGES=30
AUTO_SYNC_ON_STARTUP=true

BOT_KEY=child_rearing_bot
ENABLE_SHERLAR_CHECK=false

PAYMENT_URL=...
CLICK_SERVICE_ID=...
CLICK_MERCHANT_ID=...
CLICK_SECRET_KEY=...
CLICK_MERCHANT_USER_ID=...
```

## Run

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm run start:prod
```

## Bot Commands

- `/start` - start bot flow
- `/language` - switch language (`EN` / `RU`)
- `/sync` - sync content manually (admin only)

## Notes

- English content source: `http://www.programsoft.uz/api/service/76`
- Russian content source: `http://www.programsoft.uz/api/service/138`
- Language is stored per user in DB (`users.preferredLanguage`).

