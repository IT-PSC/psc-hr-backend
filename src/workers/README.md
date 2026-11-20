# Workers (BullMQ + Redis)

Queues registered in `src/modules/queue`:

| Queue | Processor | Purpose |
|-------|-----------|---------|
| `punch-reminders` | `PunchRemindersProcessor` | Check-in / check-out reminders (Asia/Phnom_Penh) |
| `telegram` | `TelegramProcessor` | Outbound Telegram (token from `TELEGRAM_BOT_TOKEN` only) |
| `exports` | `ExportsProcessor` | Async report / CSV exports |

## Local Redis

```bash
docker compose up -d redis
```

HTTP enqueue helpers (JWT + permission required):

- `POST /api/workers/punch-reminder`
- `POST /api/workers/telegram`
- `POST /api/workers/export`

Processors currently log stubs; wire real Telegram / file storage in later phases.
