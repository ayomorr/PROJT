# ScrollGuard — Database Schema

**Storage in the MVP:** SQLite (via Node's built-in `node:sqlite`).
**Production target:** the same model maps 1:1 onto PostgreSQL / MongoDB.

The design rule: **the user's attention data belongs to the user.** Nothing private is
collected beyond what makes the product work. No social-media passwords, ever.

## Entities

### users
| column         | type    | notes                                        |
| -------------- | ------- | -------------------------------------------- |
| id             | TEXT    | UUID primary key                             |
| name           | TEXT    |                                              |
| email          | TEXT    | unique, lowercased                           |
| passwordHash   | TEXT    | bcrypt                                       |
| role           | TEXT    | `user` \| `admin`                            |
| dailyGoal      | INTEGER | minutes (default 90)                         |
| goals          | TEXT    | JSON array of onboarding goals               |
| platforms      | TEXT    | JSON array of chosen platforms               |
| scrollTimes    | TEXT    | JSON array of typical scrolling windows      |
| streak         | INTEGER | current streak in days                       |
| lastActiveDay  | TEXT    | `YYYY-MM-DD` for streak calc                 |
| troubleLimitMin| INTEGER | session length (min) for "awareness" reminders |
| createdAt      | TEXT    | ISO timestamp                                |

### platforms
| column | type    | notes                                    |
| ------ | ------- | ---------------------------------------- |
| id     | TEXT    | slug key, e.g. `tiktok`                  |
| name   | TEXT    | display name                              |
| icon   | TEXT    | emoji / icon token                        |
| domain | TEXT    | primary domain used for extension matches |
| color  | TEXT    | brand-ish accent for cards                |

Seeded with: TikTok, Instagram, YouTube, Facebook, X, Reddit, Snapchat, LinkedIn.

### usage_sessions
| column     | type    | notes                                    |
| ---------- | ------- | ---------------------------------------- |
| id         | TEXT    | UUID                                     |
| userId     | TEXT    | FK → users                               |
| platformId | TEXT    | FK → platforms                           |
| startTime  | TEXT    | ISO timestamp                            |
| endTime    | TEXT    | ISO timestamp (NULL if still live)       |
| duration   | INTEGER | seconds                                  |
| tag        | TEXT    | `web` \| `manual` \| `mobile`            |
| source     | TEXT    | `extension` \| `manual` \| `api` \| `demo` |
| inSessionLimitTurned | INTEGER | 0/1 — was this capped by session limit? |

### daily_stats
Aggregated per user per day (denormalized for fast dashboard reads).
| column         | type    | notes                                    |
| -------------- | ------- | ---------------------------------------- |
| id             | TEXT    | UUID                                     |
| userId         | TEXT    | FK → users                               |
| date           | TEXT    | `YYYY-MM-DD`                              |
| totalSeconds   | INTEGER | total tracked time that day              |
| sessions       | INTEGER | number of sessions                        |
| longestSession | INTEGER | seconds of the longest session            |
| attentionScore | INTEGER | 0–100 computed for that day               |
| withinGoal     | INTEGER | 0/1                                      |

### user_limits
| column       | type    | notes                                    |
| ------------ | ------- | ---------------------------------------- |
| id           | TEXT    | UUID                                     |
| userId       | TEXT    | FK → users                               |
| platformId   | TEXT    | FK → platforms (NULL = global)           |
| dailyLimitMin| INTEGER | daily cap in minutes                     |
| sessionLimitMin | INTEGER | max single-session length              |
| quietStart   | TEXT    | `HH:MM` (empty = disabled)               |
| quietEnd     | TEXT    | `HH:MM`                                  |

### challenges
| column     | type    | notes                                    |
| ---------- | ------- | ---------------------------------------- |
| id         | TEXT    |                                          |
| title      | TEXT    |                                          |
| description| TEXT    |                                          |
| category   | TEXT    | e.g. `morning`, `evening`, `focus`       |
| duration   | TEXT    | e.g. `1 day`                             |

Badge table seeded with supportive, judgment-free challenges.

### challenge_completions
| column      | type   | notes                                    |
| ----------- | ------ | ---------------------------------------- |
| id          | TEXT   | UUID                                     |
| userId      | TEXT   | FK                                       |
| challengeId | TEXT   | FK                                       |
| completedAt | TEXT   | ISO timestamp (date part = completion day) |

### focus_sessions
| column      | type    | notes                                    |
| ----------- | ------- | ---------------------------------------- |
| id          | TEXT    | UUID                                     |
| userId      | TEXT    | FK                                       |
| startTime   | TEXT    | ISO                                      |
| plannedMin  | INTEGER | chosen length                            |
| platformsText | TEXT  | JSON array of platforms to avoid          |
| completed   | INTEGER | 0/1                                     |

### reminder_events
Every intervention is logged (for UX polish and anonymous analytics).
| column      | type    | notes                                    |
| ----------- | ------- | ---------------------------------------- |
| id          | TEXT    | UUID                                     |
| userId      | TEXT    | FK                                       |
| sessionId   | TEXT    | FK → usage_sessions                      |
| level       | INTEGER | 1, 2 or 3                                |
| decision    | TEXT    | `continue` \| `break` \| `snooze`        |
| createdAt   | TEXT    | ISO                                      |

### reset_tokens
| column   | type   | notes                                    |
| -------- | ------ | ---------------------------------------- |
| token    | TEXT   | random, hashed                          |
| userId   | TEXT   | FK                                       |
| expiresAt| TEXT   | ISO                                      |

---

## Open-session model

Usage data arrives in two ways:

1. **Live sessions** (`session/start` → `session/end`): the extension (or a future native
   app) opens a session when a supported site becomes active, and closes it when the tab
   is hidden/closed or after 60 s idle. During a live session the backend computes the
   **intervention level** (`1 / 2 / 3`) from the user's limits.
2. **Committed sessions** (manual entry or `POST /api/usage/session`): rows that already
   have a duration.

`daily_stats` is recomputed lazily (on read) from committed sessions for the requested day.

## Privacy by design

- Only the logged-in user (or an admin with aggregate access) can read their sessions.
- Admin analytics are **aggregated** only — no per-user private details exposed.
- `DELETE /api/user/account` removes every row belonging to the user across all tables
  (there are no foreign keys with cascade enabled in SQLite by default, so deletion is
  done explicitly in a transaction — see `backend/src/db.js`).