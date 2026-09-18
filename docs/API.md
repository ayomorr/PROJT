# ScrollGuard — API Reference

Base URL (dev): `http://localhost:4000/api`

All endpoints, except the public auth endpoints, require authentication.

## Authentication

| Method | Path                      | Body / Notes                                                            |
| ------ | ------------------------- | ----------------------------------------------------------------------- |
| POST   | `/api/auth/register`      | `{ name, email, password, goals[], platforms[], dailyGoalMin, scrollTimes[] }` |
| POST   | `/api/auth/login`         | `{ email, password }` → sets httpOnly cookie + returns `{ token, user }` |
| POST   | `/api/auth/logout`        | clears the auth cookie                                                   |
| POST   | `/api/auth/forgot-password` | `{ email }` → returns a reset token (dev mode prints it to console)     |
| POST   | `/api/auth/reset-password` | `{ token, password }`                                                   |

`register` and `login` both accept an optional `?demo=1` utility (used by demo mode) —
not a real product feature.

## User

| Method | Path              | Notes                                              |
| ------ | ----------------- | -------------------------------------------------- |
| GET    | `/api/user/profile` | current user + onboarding flags                    |
| PUT    | `/api/user/profile` | update `name`, `dailyGoalMin`, goals, scrollTimes  |
| DELETE | `/api/user/account` | permanently delete the account and all data        |

## Usage

| Method | Path                  | Notes                                                        |
| ------ | --------------------- | ------------------------------------------------------------ |
| GET    | `/api/usage/today`    | today's totals, per-platform breakdown, sessions list        |
| GET    | `/api/usage/weekly`   | 7 days of stats, totals, trend vs previous week               |
| GET    | `/api/usage/sessions` | recent sessions (paginated with `?limit=`)                    |
| POST   | `/api/usage/session`  | `{ platform, startTime, endTime? }` (manual + extension log)  |

### Live session endpoints

| Method | Path                          | Notes                                        |
| ------ | ----------------------------- | -------------------------------------------- |
| POST   | `/api/usage/session/start`    | `{ platform, tag? }` → `{ sessionId }`       |
| POST   | `/api/usage/session/end`      | `{ sessionId }` → closes the open session    |
| GET    | `/api/usage/active`           | current open session + intervention level    |
| POST   | `/api/usage/session/reminder` | `{ sessionId, level, decision }` — records a reminder response |

## Platforms

| Method | Path             | Notes                                              |
| ------ | ---------------- | -------------------------------------------------- |
| GET    | `/api/platforms` | supported platforms + which ones have a live session concept |

## Limits

| Method | Path              | Notes                                  |
| ------ | ----------------- | -------------------------------------- |
| GET    | `/api/limits`     | current limits for the user            |
| POST   | `/api/limits`     | upsert a limit by platform             |
| PUT    | `/api/limits/:id` | update a single limit                  |
| DELETE | `/api/limits/:id` | remove a limit                          |
| POST   | `/api/limits/session` | global session limit + max session minutes |

## Insights & AI

| Method | Path             | Notes                                                       |
| ------ | ---------------- | ----------------------------------------------------------- |
| GET    | `/api/insights`  | weekly summary, hourly heatmap, platform ranking, best suggestion, attention score trend |
| POST   | `/api/ai/chat`   | `{ messages }` → Guard (offline coach or real LLM via `AI_API_KEY`) |
| POST   | `/api/ai/pattern` | `{ text }` → structured `{ message, insight, suggestedAction, tone }` |

## Focus & Challenges

| Method | Path                      | Notes                                  |
| ------ | ------------------------- | -------------------------------------- |
| POST   | `/api/focus/start`        | `{ minutes, platforms[] }` → `{ focusId }` |
| POST   | `/api/focus/end`          | `{ focusId }` (optional) closes focus  |
| GET    | `/api/focus/active`       | current focus session if any           |
| GET    | `/api/challenges`         | today's + all challenges               |
| POST   | `/api/challenges/:id/complete` | marks the challenge done today    |

## Admin

| Method | Path                | Notes                                        |
| ------ | ------------------- | -------------------------------------------- |
| GET    | `/api/admin/stats`  | aggregated analytics (admin role required)   |

## Errors

Every error is returned as:

```json
{ "error": "a human-readable message" }
```

with a proper HTTP status code. See `docs/SETUP.md` → Errors for the full list of
error states covered.

## AI responses

`POST /api/ai/pattern` returns a validated structure:

```json
{
  "message": "...",
  "insight": "...",
  "suggestedAction": "...",
  "tone": "supportive"
}
```

The backend validates the structure before returning it. If validation fails, Guard
falls back to its offline safety response.