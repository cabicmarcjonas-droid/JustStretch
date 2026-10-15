# Just Stretch (JustStretch1: React + Node)

Just Stretch is a browser-based guided stretching app for people with minor chronic muscle pain. Watch a reference video, stretch in front of your webcam, and MediaPipe tracks your pose in the browser. The app compares your joint angles with the reference and saves a session score.

This folder is the group's main app. It merges the JustStretch1 interface (emerald and slate palette, bold italic headings, sliding login card, team section, streak and benefits panels) with the full-stack features from the Laravel build, converted to React + Node: real accounts, the exercise library, session history and the pose-scored webcam session. Stack: Vite + React 19 + React Router 7 + Tailwind CSS v4 on the front, an Express 5 REST API with MongoDB (Mongoose) on the back.

A copy of the conversion on its own (Laravel look) is in `../Laravel converted to React/`.

## Requirements

| Software | Version used |
|---|---|
| Node.js | 26 (22.9 or newer is required) |
| npm | 11 |
| Browser | Chrome, Edge or Firefox with a webcam |
| MongoDB | Optional. Without it the API starts an in-memory database (see below) |

**Internet access is required during the demo.** The MediaPipe wasm files and both models (pose and hand) are downloaded from a CDN every time the session page opens, and the fonts come from fonts.bunny.net. Open the session page once online before the demo to check.

## Setup (macOS, zsh)

From this folder:

```zsh
npm install
npm run dev
```

`npm install` also installs the server (`server/`). `npm run dev` starts both:

| What | URL |
|---|---|
| Client (Vite) | http://localhost:5173 |
| API (Express) | http://localhost:3001 (Vite proxies `/api` to it) |

Open **http://localhost:5173**. The webcam only works on `localhost` / `127.0.0.1`, not on a LAN IP. The first time you press Start, macOS asks for camera permission for the browser; allow it.

### Database

The API reads `MONGODB_URI` from `server/.env` (copy `server/.env.example` to `server/.env` to change it).

- **With MongoDB running**, run `npm run seed` once to create the demo data. Run it again at any time to reset the database.
- **Without MongoDB** (or if the connection fails) in development, the API logs a warning, starts `mongodb-memory-server`, and seeds it automatically on every start. Nothing needs to be installed, but data is lost when the API stops, so sessions you save during a demo disappear after a restart. `node --watch` restarts the API when a server file is edited, so don't edit files in `server/` while demoing.
- The first run with the in-memory database downloads a MongoDB binary (about 66 MB), so do it once before the demo while you are online. It is cached afterwards.

`npm run seed` does nothing (and says why) when no MongoDB is reachable, because the in-memory database seeds itself.

### Windows notes for groupmates

- Use PowerShell and run commands one per line (PowerShell 5.1 has no `&&`).
- To create the env file: `copy server\.env.example server\.env`.
- Windows does not care about file-name case, but the build fails on macOS/Linux if an import has the wrong case. Match the case of the file exactly.
- The first run without MongoDB downloads a Windows MongoDB binary; it may need the Visual C++ Redistributable, and antivirus can slow or block the download.
- If `bcrypt` fails to load after `npm install`, run `npm rebuild bcrypt` inside `server/`.

## Demo account

| Email | Password |
|---|---|
| `demo@juststretch.test` | `password` |

Other seeded accounts (same password): `miguel.estallo@example.net`, `rene.baterbonia@gmail.com`, and 7 generated users.

The demo user owns *Neck Side Tilt*, *Doorway Chest Stretch* and *Figure-Four Hip Stretch*, so edit/delete can be shown. Every other exercise belongs to someone else: open its `/exercises/<id>/edit` page to see the 403 page. Exercise ids are Mongo ids that change on every seed, so open the exercise from the library and add `/edit` to the address.

Four exercises have a reference video and pose file and are scored by the camera: *Neck Side Tilt*, *Cross-Body Shoulder Stretch*, *Overhead Side Bend* and *Standing Hamstring Reach* (the last one is filmed from the side, so stand side-on to the camera). Every other exercise falls back to the self-rated score slider.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Client and API together |
| `npm run seed` | Reset and reseed the database in `MONGODB_URI` |
| `npm run build` | Production build of the client into `dist/` |
| `npm run lint` | ESLint for client and server |
| `npm test` | API tests (`node:test` + `supertest`, in-memory MongoDB) |

## Pages

| Page | Route | Access |
|---|---|---|
| Landing (hero, how it works, features, contact) | `/` | Public |
| About and team | `/about` | Public |
| Login / Register (one sliding card) | `/login`, `/register` | Guests only |
| Dashboard (stats, suggestions, streak, benefits) | `/dashboard` | Logged in |
| Exercise library (search, filters, pagination in the URL) | `/exercises` | Logged in |
| Add exercise | `/exercises/new` | Logged in |
| Exercise detail | `/exercises/:id` | Logged in (edit/delete for the author only) |
| Edit exercise | `/exercises/:id/edit` | Author only, others see the 403 page |
| Webcam session | `/exercises/:id/session` | Logged in |
| Session history | `/sessions` | Logged in |
| Profile | `/profile` | Logged in |

## API

All routes are under `/api`. Errors are JSON; validation failures return `422 { errors: { field: [messages] } }` with the same messages as the Laravel form requests. Protected routes return `401` without a session and `403` when a non-author edits or deletes an exercise or a non-owner deletes a session.

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | Server-side session cookie (httpOnly, `sameSite: lax`) |
| GET | `/auth/me` | `{ user }` or `{ user: null }` |
| PATCH / PUT / DELETE | `/profile`, `/profile/password`, `/profile` | Name and email, password, delete account |
| GET / POST | `/exercises` | 9 per page; `search`, `area`, `difficulty`, `page` |
| GET / PUT / DELETE | `/exercises/:id` | PUT and DELETE are author only |
| POST | `/exercises/:id/sessions` | Saves a session for the current user |
| GET | `/sessions` | Own sessions, 15 per page, `exercise` filter |
| DELETE | `/sessions/:id` | Owner only |
| GET | `/dashboard` | Totals, 7-day average, minutes this week (weeks start Monday, Asia/Manila), top area, day streak (Asia/Manila), recent sessions, suggestions |

## Folder layout

```
src/            React client (pages, layouts, components, css/, pose/, lib/)
  pose/         PoseStage.jsx + poseTracker.js (MediaPipe, webcam, scoring)
  lib/          api.js, eventBus.js, poseComparison.js (unchanged from Laravel), enums.js
server/         Express API (routes, models, middleware, shared/enums.js, src/ entry, db and seed)
public/         videos/ and poses/ (reference clips and their pose data)
```

## Old JustStretch1 addresses

`/main` redirects to `/dashboard` and `/exercise/:id` redirects to `/exercises/:id`.

## Privacy

Pose tracking runs entirely in the browser. Camera frames and body landmarks are never sent to the server; only the score, duration and optional notes are saved.

## Not converted yet

See [PARKED.md](PARKED.md).
