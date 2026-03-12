# 🔥 Похудение Tips Telegram Bot

Telegram bot with Click payment integration for delivering weight-loss tips in Russian.

## ✨ Features

- 🇷🇺 Только русский язык
- 🎲 Случайный выбор советов по похудению
- 💳 Click.uz to'lov integratsiyasi
- 👤 Foydalanuvchilar boshqaruvi
- 📊 Ko'rishlar statistikasi
- 🔄 API dan avtomatik sinxronlash
- 🎯 5 ta bepul fakt
- ✅ Bir martalik to'lov - cheksiz kirish

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Grammy (Telegram Bot Framework)
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Payment:** Click.uz
- **Language:** TypeScript

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Telegram Bot Token
- Click.uz Merchant Account

## 🚀 Installation

1. **Clone repository:**
   ```bash
   git clone <your-repo-url>
   cd pul_topish
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment:**
   ```bash
   cp .env.example .env
   ```

4. **Configure `.env` file:**
   ```env
   BOT_TOKEN=your_telegram_bot_token

   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASS=your_password
   DB_NAME=pul_topish

   CLICK_SERVICE_ID=87085
   CLICK_MERCHANT_ID=7269
   CLICK_SECRET_KEY=your_click_secret_key
   PAYMENT_URL=http://213.230.110.176:9999/pay
   PAYMENT_WEBHOOK_SECRET=your_webhook_secret

   PORT=3000
   ADMIN_IDS=your_telegram_id

   # ProgramSoft API (Weight Loss Tips)
   PROGRAMSOFT_API_URL=https://www.programsoft.uz/api
   PROGRAMSOFT_SERVICE_ID=165
   PROGRAMSOFT_PAGES=30
   ```

5. **Create database:**
   ```bash
   createdb pul_topish
   ```

## 🎮 Usage

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm run start:prod
```

### Sync facts manually:
Use `/sync` command in bot (admin only)

## 🔧 Project Structure

```
src/
├── database/
│   └── data-source.ts       # TypeORM configuration
├── entities/
│   ├── User.ts              # User entity
│   ├── Joke.ts              # Facts content (stored in jokes table)
│   └── Payment.ts           # Payment entity
├── services/
│   ├── user.service.ts      # User business logic
│   ├── joke.service.ts      # ProgramSoft API integration (facts)
│   └── click.service.ts     # Click payment service
├── handlers/
│   ├── bot.handlers.ts      # Bot command handlers
│   └── webhook.handlers.ts  # Click webhook handlers
└── main.ts                  # Application entry point
```

## 📱 Bot Commands

- `/start` - Start bot and show content
- `/sync` - Sync facts from API (admin only)

## 💰 Payment Flow

1. User views 5 free facts
2. Bot offers payment option
3. Click payment link generated
4. User completes payment
5. Webhook confirms payment
6. User gets unlimited access

## 🔐 Click.uz Integration

### Webhook URL:
```
https://yourdomain.com/webhook/pay
```

### Methods Implemented:
- ✅ PREPARE (action=0)
- ✅ COMPLETE (action=1)

### Security:
- Signature verification
- Amount validation
- Transaction deduplication

## 📊 Database Schema

### Users
- telegramId (unique)
- username, firstName, lastName
- hasPaid (boolean)
- viewedJokes (counter)

### Facts (jokes table)
- externalId (from API)
- language (ru)
- category
- content (text)
- views (counter)

### Payments
- transactionParam (UUID)
- userId (relation)
- amount, status
- Click transaction IDs
- metadata (JSONB)

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| BOT_TOKEN | Telegram bot token | ✅ |
| DB_HOST | PostgreSQL host | ✅ |
| DB_PORT | PostgreSQL port | ✅ |
| DB_USER | Database user | ✅ |
| DB_PASS | Database password | ✅ |
| DB_NAME | Database name | ✅ |
| PROGRAMSOFT_API_URL | ProgramSoft API base | ✅ |
| PROGRAMSOFT_SERVICE_ID | ProgramSoft service ID (`165`) | ❌ |
| PROGRAMSOFT_PAGES | Number of pages to sync | ❌ |
| CLICK_SERVICE_ID | Click service ID | ✅ |
| CLICK_MERCHANT_ID | Click merchant ID | ✅ |
| CLICK_SECRET_KEY | Click secret key | ✅ |
| PAYMENT_URL | Payment URL | ✅ |
| PAYMENT_WEBHOOK_SECRET | Webhook secret | ❌ |
| PORT | Webhook server port | ❌ |
| ADMIN_IDS | Admin Telegram IDs | ❌ |

## 🐛 Troubleshooting

### Database connection error:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Create database if not exists
createdb pul_topish
```

### Bot not responding:
- Check BOT_TOKEN is correct
- Verify bot is not running elsewhere
- Check network/firewall settings

### Webhook not working:
- Ensure server is publicly accessible
- Check HTTPS certificate (production)
- Verify Click.uz webhook URL configured

## 📝 License

MIT

## 👨‍💻 Author

Professional Senior Developer

---

Made with ❤️ using Grammy & TypeScript
