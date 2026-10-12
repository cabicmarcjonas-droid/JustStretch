# Just Stretch — Laravel Edition

Just Stretch is a guided stretching and gentle-rehab web app for people with minor chronic muscle pain such as a stiff neck or tight lower back. Members browse and contribute to a database-backed exercise library, run a live webcam session where MediaPipe Pose (body) and Hand Landmarker (fingers) highlight the joints for the target body area, and log a self-rated form score that is summarised on their dashboard.

## Requirements

| Software | Version used |
|---|---|
| PHP | 8.5.10 (with `pdo_sqlite` and `sqlite3` enabled) |
| Composer | 2.10.3 |
| Node.js | 26.5.0 |
| npm | 11.17.0 |
| Browser | Chrome, Edge or Firefox with a webcam (for the session page) |

Laravel 13.34.0, Laravel Breeze 2.4.2 (Blade + Alpine), Tailwind CSS 3.4.19, Alpine.js 3.17.4, Vite 8.3.2 and `@mediapipe/tasks-vision` 1.0.1 are installed by Composer/npm.

## Setup

From the `laravel/` folder, in PowerShell (PowerShell 5.1 has no `&&`, so run each line separately):

```powershell
composer install
copy .env.example .env
php artisan key:generate
php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
npm install
npm run build
php artisan migrate:fresh --seed
```

The app uses SQLite (`DB_CONNECTION=sqlite`) and the `Asia/Manila` timezone.

> If Composer fails with "bootstrap\cache directory must be present and writable" on Windows, clear the read-only attribute on the project folders with `attrib -R .\* /S /D` and run `php artisan package:discover` again.

### Seed the demo data

```powershell
php artisan migrate:fresh --seed
```

This creates 10 users, 15 exercises and 40 stretch sessions.

## Running

Use two terminals:

```powershell
# Terminal 1
php artisan serve

# Terminal 2
npm run dev
```

Open **http://127.0.0.1:8000**. The webcam needs a secure context, so use `127.0.0.1` or `localhost` (a LAN IP will not get camera access).

## Demo account

| Email | Password |
|---|---|
| `demo@juststretch.test` | `password` |

The demo user owns *Neck Side Tilt*, *Doorway Chest Stretch* and *Figure-Four Hip Stretch* (IDs 1, 5 and 9 after a fresh seed), so edit/delete can be shown. Every other exercise belongs to another user, e.g. `/exercises/2/edit` returns the 403 page.

## Pages

| Page | Route | Auth |
|---|---|---|
| Home | `GET /` | Public |
| About | `GET /about` | Public |
| Register / Login | `GET /register`, `GET /login` | Guest |
| Dashboard | `GET /dashboard` | Yes |
| Exercise library (search + filters) | `GET /exercises` | Yes |
| Exercise detail | `GET /exercises/{exercise}` | Yes |
| Add exercise | `GET /exercises/create` | Yes |
| Edit exercise (author only) | `GET /exercises/{exercise}/edit` | Yes |
| Webcam session | `GET /exercises/{exercise}/session` | Yes |
| Session history | `GET /sessions` | Yes |
| Profile | `GET /profile` | Yes |

## Tests

```powershell
php artisan test
```

42 tests (Breeze auth/profile tests plus `tests/Feature/ExerciseTest.php` and `tests/Feature/StretchSessionTest.php`).

## Privacy

Pose tracking runs entirely in the browser. No camera frames or body landmarks are sent to the server; only the score, duration and optional notes are saved.

## Reference videos and pose data

`public/videos/` holds the rendered Blender demo videos, which play on the matching exercise pages (Neck Side Tilt, Cross-Body Shoulder Stretch, Overhead Side Bend, Standing Hamstring Reach). `public/poses/` holds the reference pose data for the same clips (`pose_<clip>.json`), exported from Blender at 30 fps: per frame, the MediaPipe-style landmarks and joint angles. Compare the live webcam angles against `angles_2d`. The Standing Hamstring Reach clip is filmed from the side, so the user should stand side-on to the camera. The JSON files are not used by the app yet.
