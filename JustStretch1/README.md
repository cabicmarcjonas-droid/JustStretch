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

The demo user owns *Neck Side Tilt*, *Overhead Side Bend* and *Standing Torso Twist*, so edit/delete can be shown. Every other exercise belongs to someone else: open its `/exercises/<id>/edit` page to see the 403 page. Exercise ids are Mongo ids that change on every seed, so open the exercise from the library and add `/edit` to the address.

The six exercises in the library each have a reference video and pose file and are scored by the camera: *Neck Side Tilt*, *Shoulder Rolls*, *Cross-Body Shoulder Stretch*, *Overhead Side Bend*, *Standing Torso Twist* and *Standing Windmill Arms*. An exercise added by a member without a video falls back to the self-rated score slider.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Client and API together |
| `npm run seed` | Reset and reseed the database in `MONGODB_URI` |
| `npm --prefix server run backfill` | Give older sessions synthetic per-joint results (`-- --undo` takes them back out) |
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
| Session detail (per-joint results) | `/sessions/:id` | Owner only |
| Profile (body map, flexibility, account) | `/profile` | Logged in |

## API

All routes are under `/api`. Errors are JSON; validation failures return `422 { errors: { field: [messages] } }` with the same messages as the Laravel form requests. Protected routes return `401` without a session and `403` when a non-author edits or deletes an exercise or a non-owner deletes a session.

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | Server-side session cookie (httpOnly, `sameSite: lax`) |
| GET | `/auth/me` | `{ user }` or `{ user: null }` |
| PATCH / PUT / DELETE | `/profile`, `/profile/password`, `/profile` | Name and email, password, delete account |
| GET / PUT | `/profile` | The body map (pain areas) and the starting flexibility baseline. PUT changes nothing else about the account |
| GET / POST | `/exercises` | 9 per page; `search`, `area`, `difficulty`, `page` |
| GET / PUT / DELETE | `/exercises/:id` | PUT and DELETE are author only |
| POST | `/exercises/:id/sessions` | Saves a session for the current user, with the camera's tracking results when the exercise has a reference pose. Runs the referral check and returns `referral` (or `null`) |
| GET | `/sessions` | Own sessions, 15 per page, `exercise` filter |
| GET | `/sessions/:id` | One session with its per-joint results and referral (therapist contact included), owner only |
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

## Demo data and the tracking results

A session saved with the camera keeps the per-joint tracking results: the average angle error and the share of judged frames each joint stayed inside its margin, plus the judged frame count, the frames within the margin, the dropped frames and the tracking score. The seeded demo sessions include them, so the session detail page (`/sessions/:id`) has something to show.

Sessions saved before those fields existed cannot have them: the tracker only displayed them, it never stored them, so they show the "no camera tracking data" note. `npm --prefix server run backfill` fills those older sessions with synthetic numbers derived from the score each one already has, so the demo looks complete. **Those numbers are made up, not measurements.** `npm --prefix server run backfill -- --undo` removes them again.

## Therapist referral

After a session is saved, the API looks at the member's last 3 sessions for the same body area (any exercise in that area). If all 3 scored below 50, or all 3 were rated 4 or more on the fatigue scale, the session is flagged and the response carries a physical therapist's contact details. The app then opens the session page, which shows the referral card. The numbers live in `server/shared/referral.js`.

Therapists are not users. The seed adds 4 **sample** therapists (`placeholder: true`, shown as "Sample contact" in the UI). They are not real clinics: replace them with real, consenting contacts before any public use. A database seeded before this feature gets the sample therapists added on the next server start.

To see it in the demo: open any neck stretch, end three sessions in a row with a score under 50, and save each one.

## Performance tests for the paper (Tables 6 and 7, Test Case 2)

Add `?perf` to a session page URL, for example `/exercises/<id>/session?perf`. Then:

- After you press End, a **Performance (test mode)** panel lists latency, frame processing time, FPS, dropped frames, no-pose frames and out-of-order frames against the paper's targets.
- **Save session** stays on the page and adds the save's response time (round trip, plus the server's own time from its `Server-Timing` header). The perf summary is stored with the session.
- **Download log (JSON)** saves the summary, every frame (frame ID, camera frame number, timings) and the API timings. **Download frames (CSV)** saves the frame rows for a spreadsheet.

Extra URL options, all used together with `?perf`:

| Option | What it does |
|---|---|
| `&trial=60` | Stops the session by itself after 60 seconds, for the 60-second trials |
| `&delay=100` | Test Case 2: adds a 100 ms delay to frame 150 |
| `&delayAt=300` | Delays frame 300 instead of 150 |
| `&delayEvery=90` | Repeats the delay every 90 frames after the first one |
| `&delayCount=5` | Stops after 5 delays |

Example: `/exercises/<id>/session?perf&trial=60&delay=100&delayEvery=300`.

The angle accuracy check against Blender (paper, 3.3) is not part of this.

## Privacy

Pose tracking runs entirely in the browser. Camera frames and body landmarks are never sent to the server; only the score, the duration, the optional notes and the tracking results are saved. The tracking results are aggregates, not images: per joint, the average angle error and the share of judged frames the joint stayed inside its margin of error, plus the number of judged frames, the number within the margin, the number of dropped frames and the tracking score.

A session can also carry a referral flag (the reason, the body area and which therapist was shown) and, for `?perf` runs only, timing aggregates such as FPS and latency. Neither contains images or landmarks.

The profile page stores what the member types in themselves: the body areas they marked as painful and their starting flexibility measurements. Nothing about them is inferred from the camera.

## Not converted yet

See [PARKED.md](PARKED.md).
