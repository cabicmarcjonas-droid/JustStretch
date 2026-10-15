# Parked items

Things from `laravel/` that were not converted, or that differ from it, with the reason and where they live in the Laravel build.

## Not converted

| Item | Why | Where it lives in `laravel/` |
|---|---|---|
| **Forgot / reset password** | Laravel only writes the reset link to its log, and Node would need a mail setup. The "Forgot your password?" link is shown disabled with a "Coming soon" tooltip. | `app/Http/Controllers/Auth/PasswordResetLinkController.php`, `NewPasswordController.php`; `resources/views/auth/forgot-password.blade.php`, `reset-password.blade.php` |
| **Email verification** | Same reason (needs mail). The Laravel app has it switched off anyway (`MustVerifyEmail` is commented out in `User.php`). | `EmailVerificationNotificationController.php`, `EmailVerificationPromptController.php`, `VerifyEmailController.php`; `resources/views/auth/verify-email.blade.php` |
| **Confirm-password screen** | Breeze scaffolding, not used by any app page. | `ConfirmablePasswordController.php`; `resources/views/auth/confirm-password.blade.php` |
| **Most of the 42 PHPUnit tests** | Replaced by a smaller `node:test` + `supertest` suite (7 tests): register/login/me/logout, validation messages, exercise CRUD with the author-only 403, library search/filter/pagination, session create/list/delete with the owner-only 403, cascade delete, and dashboard stats. Not covered: profile endpoints, password change, account deletion. | `tests/Feature/` |
| **Login rate limiting** (5 attempts per email + IP) | Not ported. Low value for a demo, but easy to add with `express-rate-limit` if the group wants it. | `app/Http/Requests/Auth/LoginRequest.php` |
| **`session-integration.example.js`** | Example snippet only; the real integration is in `poseTracker.js`. | `resources/js/session-integration.example.js` |

## Differences from the Laravel build

- **Seed text for benefits, precautions and durations.** The Laravel seeder only lists title, area, difficulty, description, instructions and video for each exercise. Duration, benefits and precautions come from Faker in `ExerciseFactory`, so they are random in Laravel. The port reuses the same benefit and precaution pools with a fixed Faker seed (`server/src/seed.js`), so every run gives the same values, but they are not the same values as any particular Laravel database.
- **Demo sessions.** The demo user's first two sessions are pinned to the last two days so the 7-day average and "minutes this week" are never empty. The rest are random over the last 30 days, like `StretchSessionFactory`.
- **Exercise ids.** Laravel ids 1/5/9 become Mongo ids. See the README for how to find an exercise owned by someone else.
- **Session page shows the reference video.** The Blade session view had none; the project brief asks for it on both the exercise and session pages, so it sits at the top of the sidebar.
- **Live results panel refreshes 4 times a second** (`LIVE_PANEL_INTERVAL_MS = 250`). Laravel used 100 ms, which was about 10 times a second despite its comment saying "~5". Done to match the "at most 4 updates a second" rule.
- **Stale "Suggested from your camera tracking" note.** In the Alpine version the note stayed visible after a later session with no suggested score. In React it follows the latest session.
- **Score starts empty.** Following the latest Laravel commit ("no more default 70 score"), the form shows "—" until the slider is moved. Saving without choosing a score shows "The score field is required."
- **About page "Built with" list** describes the new stack and names HandLandmarker as well as PoseLandmarker.
- **Pagination** uses a simpler custom view (page numbers, previous/next) instead of Laravel's vendor view.
- **Not-found page.** Laravel's default 404 is replaced by a small branded page.

## For Patrick

`src/lib/poseComparison.js` is a byte-for-byte copy of `laravel/resources/js/poseComparison.js`; nothing in it needed changing under Vite or React. `src/pose/poseTracker.js` keeps the comparison logic as it was (reference loading, smoothing, `compareToReference`, scoring and `MIN_JUDGED_FRAMES = 30`). Only the plumbing around it changed (element refs, `destroy()`, event bus).

`laravel/README.md` still says the pose JSON files "are not used by the app yet", which is out of date.
