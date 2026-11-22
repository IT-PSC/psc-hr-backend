# Workers (BullMQ + Redis)

Queues registered in `src/modules/queue`:

| Queue | Processor | Purpose |
|-------|-----------|---------|
| `punch-reminders` | `PunchRemindersProcessor` | In-app (+ optional Telegram) attendance reminders |
| `telegram` | `TelegramProcessor` | Outbound Telegram via `TELEGRAM_BOT_TOKEN` |
| `exports` | `ExportsProcessor` | CSV stub → `StoredFile` + notification |

Job runs are audited in `JobRun` (`GET /api/workers/jobs`).

## Local Redis

```bash
docker compose up -d redis
```

Set `REDIS_ENABLED=false` to boot the API without Redis; enqueue endpoints record `skipped` jobs.

## HTTP enqueue helpers (JWT + permission)

- `POST /api/workers/punch-reminder`
- `POST /api/workers/telegram`
- `POST /api/workers/export`
- `GET /api/workers/jobs?queue=`

`TELEGRAM_BOT_TOKEN` / `TELEGRAM_DEFAULT_CHAT_ID` stay in backend `.env` only — never in the SPA.
