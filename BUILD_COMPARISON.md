# Build Comparison

A side-by-side look at the four builds in this repository, to help decide what to keep when integrating.

| Folder | What it is |
|---|---|
| `React/` | The untouched Vite + React starter template |
| `JustStretch/` | First version: a login-first React SPA |
| `JustStretch1/` | Latest React version, where all later group commits went |
| `laravel/` | Laravel rebuild (Miguel) |

Snapshot taken against `main` at commit `66c1453` (17 Aug 2026).

---

## 1. Overview

| | `React/` | `JustStretch/` | `JustStretch1/` | `laravel/` |
|---|---|---|---|---|
| What it is | Untouched Vite starter (counter button, Vite/React logos) | Login-first SPA | Latest group SPA | Full-stack rebuild |
| Contributors | Marc (initial commit only) | Marc (initial commit only) | Marc, Gabriel, Patrick | Miguel |
| Stack | React 19 + Vite 8 | React 19, React Router 7, Vite 8; Tailwind v4 installed but unused | Same, plus Tailwind v4 (used) and MediaPipe | Laravel 13, Breeze (Blade + Alpine), Tailwind v3, Vite 8, MediaPipe 1.0.1 |
| Backend / database | None | None | None | SQLite, with migrations, models and seeders |
| Browser tab title | `react` | `juststretch` | `juststretch1` | "Just Stretch", plus a title for each page |

All three React folders arrived in one commit ("Finished design update", 17 Aug 2026 00:52), so there's no history of how they were built up. They share byte-identical files: `App.css`, `README.md`, `hero.png`, the ESLint config and the Vite favicon, all leftovers from the Vite template. `React/` is only that template and could be deleted.

---

## 2. Pages and routes

| Page | `JustStretch/` | `JustStretch1/` | `laravel/` |
|---|---|---|---|
| Landing | ❌ (login is `/`) | `/`: hero plus About and Contact sections | `/`: hero, how it works, features, call to action |
| Login / Sign up | `/`: one sliding card | `/login`: one sliding card | `/login` and `/register` as separate pages |
| Home / dashboard | `/home`: heading, placeholder text, "Start Session" link | `/main`: hero, routine cards, streak, benefits, About and Contact | `/dashboard`: stats, recent sessions, suggestions |
| About | `/about` | Section on `/` and again on `/main` | `/about` |
| Contact | `/contact` | Section on `/` and again on `/main` | ❌ |
| Team / credits | Names with role "lorem", no photos | ✅ Names, real roles, photos | ❌ |
| Exercise list | ❌ | 3 cards on `/main` | `/exercises` with search, filters and pagination |
| Exercise detail / session | `/session`, a single page | `/exercise/:id` | `/exercises/{id}` (detail) and `/exercises/{id}/session` |
| Add / edit / delete exercise | ❌ | ❌ | ✅ Only the author can edit or delete |
| Session history | ❌ | ❌ | `/sessions` |
| Profile, password reset | ❌ | ❌ | ✅ From Breeze |
| 403 page | ❌ | ❌ | ✅ |

---

## 3. Login and accounts

| | `JustStretch/` | `JustStretch1/` | `laravel/` |
|---|---|---|---|
| Real accounts | ❌ Any input logs you in, even empty fields | ❌ Any input logs you in (fields are `required`) | ✅ Passwords are hashed and stored |
| Sign up | ❌ No handler; the button just reloads the page | ❌ Logs you in without saving anything | ✅ Creates a user |
| Stays logged in after refresh | ❌ Stored in `useState` | ❌ Same | ✅ Server session |
| Logout | ❌ | ❌ | ✅ |
| Forgot password | Link that does nothing | Link that does nothing | ✅ Works, but with no mail server the reset link only goes to the log file |

---

## 4. Webcam and pose tracking

| | `JustStretch/` | `JustStretch1/` | `laravel/` |
|---|---|---|---|
| Pose detection | ❌ Webcam only | ✅ 33 body points | ✅ 33 body points |
| Finger tracking | ❌ | ❌ | ✅ 21 points per hand |
| Drawing | ❌ | Lime dots only | Grey skeleton lines and dots |
| Target joints highlighted | ❌ | ❌ | ✅ Larger green joints and lines for the exercise's body area |
| When the camera turns on | On page load | On page load (the Start button doesn't control it) | Only when you press Start |
| Camera turned off when you leave | ❌ Never stopped | After a 10-second delay; the code comment says "briefly" | ✅ Immediately, on Stop or when leaving the page |
| Mirrored view | ✅ | ❌ The mirror CSS targets the old `<video>` class, not the new canvas, so movements look reversed | ✅ |
| Timer | ❌ | ❌ Static "Duration: 5 minutes" text, and the `.timer-wrapper` CSS is unused | ✅ Live elapsed time |
| Score saved | ❌ | ❌ End goes back to `/main` | ✅ Score slider, notes and duration are saved |
| Error messages | Console only | Console only. If the model fails, "Loading pose model…" stays forever | ✅ Readable messages for denied permission, no camera, camera in use, insecure address and model failure |
| MediaPipe version | n/a | `@latest` from the CDN, while package.json has `^1.0.1`, so they can drift apart | Pinned to `1.0.1` in both places |
| Frame handling | n/a | Detects on every animation frame, even when the video frame hasn't changed | Skips repeated frames |
| GPU fallback | n/a | ❌ | ✅ Falls back to CPU |
| Phone layout | n/a | Fixed `w-[640px]` box that overflows a phone screen | Fluid 4:3 canvas |
| Other notes | Tutorial video is a 26 MB `.mp4` | Under React StrictMode in development, the model loads twice and one copy is never closed | Privacy note on the page |

---

## 5. Exercise data

| | `JustStretch1/` | `laravel/` |
|---|---|---|
| Source | Hardcoded in `data/exercises.js` | Database, plus 13 seeded exercises |
| Content | "Exercise 1/2/3"; durations are strings like "5 minutes"; 3 benefits each | Real names (Neck Side Tilt, Child's Pose…), body area, difficulty, steps, benefits, precautions |
| Tutorial video | Points to `/assets/exerciseN-tutorial.mp4`, which doesn't exist, so the players are empty black boxes | "Demo video coming soon" placeholder when there's no video |
| History | Commit "Removed Exercise (4,5,6)" cut it from 6 to 3 | n/a |

`JustStretch/` has no exercise list. Its single session page plays `WIN_20241017_14_23_13_Pro.mp4` (26 MB) as the tutorial.

---

## 6. Styling

| | `JustStretch/` | `JustStretch1/` | `laravel/` |
|---|---|---|---|
| Look | Only the login page is styled; everything after login is plain browser default | Emerald and slate colours, bold italic black headings, mesh-gradient backgrounds | Group palette (ink, paper, line, muted, accent green `#3f6b52`), Fraunces and Inter fonts, thin borders, no gradients |
| Palette tokens | ❌ | Defined in `theme.css` (the same 5 hex values) but **never used**; all CSS uses `emerald-600`/`slate-*` | ✅ Used everywhere |
| Fonts | `"Euclid Circular B"` named but never loaded | Fraunces and Inter named in `theme.css` but never loaded, so the system font shows | ✅ Loaded from fonts.bunny.net |
| Tailwind | Installed, but `index.css` is empty, so it's off | v4 through `theme.css`. `index.css` is never imported. `src/tailwind.config.js` is v3-style, in the wrong folder, and ignored by v4, so `brandBlue`/`brandGreen` do nothing | v3 with `tailwind.config.js` |
| Phone layout | ❌ | ❌ No mobile menu (5 links with `gap-8` overflow); the login card's two half-panels get very narrow | ✅ Hamburger menus, tested down to 375px |
| Login card | Sliding animation, photo panel (`DSC_6199.JPG`, 13 MB) | Sliding animation, solid emerald panel | Breeze's plain card, restyled |

---

## 7. Text

| | `JustStretch/` | `JustStretch1/` | `laravel/` |
|---|---|---|---|
| Home | Placeholder (lorem ipsum) paragraph | "Stretch better. Move better. Feel better." | Written copy |
| About | Placeholder heading and lorem ipsum text | Real paragraph, but it mentions "gamified progress tracking" and "seamless referrals to professional therapists", which aren't built yet | Problem, approach, SDG 3/10/17, tech stack, privacy, medical disclaimer |
| Login panel | Template text: "review your latest profit from investments", "start earning now" | Fixed: "Sign in to continue your routine" | Breeze defaults |
| Team roles | "lorem" for all four | Marc: Frontend & UI. Miguel: Content Creation & Asset Management. Patrick: Computer Vision & Pose Tracking. Gabriel: Pose Analysis & Backend | n/a |
| Contact | `juststretch@gmail.com`, Mandaluyong City; form shows `alert("Message Sent!")` | Same info; placeholder email `JuanDelaCruz@gmail.com`; `alert("Message Sent")` | n/a |
| Footer | "Just a team with a big dream.", current year | Same tagline, "© 2026" hardcoded | Disclaimer, nav links |

---

## 8. Known issues

### `JustStretch/`
- **Filename case.** `App.jsx` imports `Home.jsx`, `About.jsx` and `Contact.jsx`, but the files are lowercase (`home.jsx` and so on). `Login.css` loads `DSC_6199.jpg`, but the file is `DSC_6199.JPG`. Windows ignores the difference, but the build fails on Linux or Mac and on any hosting service.
- **Footer typo.** It uses `classname=` instead of `className=`, so React warns and the class is never applied.
- **Missing icons.** The login card has Font Awesome icon classes, but Font Awesome is never loaded, so it shows three empty circles.
- **Unused imports.** `contact.jsx` imports `React` and `useState` without using them.

### `JustStretch1/`
- **Unused imports.** `ExercisePage.jsx` imports `useRef` and `useEffect` without using them.
- **Dead buttons and links.** The "Get Started" button on `/main` does nothing. The nav has no link to `#workouts`.
- **Hardcoded content.** The streak always says "5 days", and the benefits list never changes.
- **Leftover CSS.** `LoginPage.css` still has `.sso` and `.form p` rules for elements that were removed.
- **Duplicated sections.** About and Contact render on both `/` and `/main`.
- **Large photo.** `team_img/Estallo.png` is 1.2 MB and could be compressed.

### `laravel/`
- **Hand tracking isn't mentioned.** The About page's "Built with" list names only PoseLandmarker, and the Home feature card says "MediaPipe Pose". Neither mentions HandLandmarker, which the app also uses.
- **Leftover package.** `package.json` lists `@tailwindcss/vite ^4` next to `tailwindcss ^3`. The v4 plugin is a leftover from Laravel 13's starter and `vite.config.js` doesn't load it. It's harmless.
- **Internet required.** Both models download from the CDN on every page load, the same as in `JustStretch1/`. This build loads two models, so the first load is heavier.
- **Self-rated score.** The score is entered by the user, not computed from the pose.
- **Missing pieces.** There's no Contact page, team section, streaks or real tutorial videos.

### Repo-wide
- **Heavy history.** The repo holds a 13 MB photo and a 26 MB video. A `node_modules` folder (about 35 MB of MediaPipe wasm) was committed and then deleted, but it's still in the history, so every clone downloads it.

---

## 9. What each side has that the other doesn't

**Only in the React builds:** the team section with photos, the Contact form (it doesn't send anything), the sliding login/sign-up animation, a working tutorial video (`JustStretch/` only), the streak and benefits panels (hardcoded), and the emerald visual style.

**Only in `laravel/`:** real accounts and logout, a database, exercise add/edit/delete limited to the author, search, filters and pagination, dashboard stats, session history with saved scores, skeleton lines, highlighted target joints, finger tracking, a timer, readable camera errors, empty states, flash messages, the 403 page, phone layouts and 42 tests.

---

## 10. Decisions for integration

- **Visual style.** Emerald and slate (`JustStretch1/`) or the ink/paper/accent palette (`laravel/`)? `JustStretch1/src/css/theme.css` already defines the second palette but never uses it.
- **Which build becomes the main app.** Port the Laravel features into React (which would need a backend), or port the React-only pieces (team section, Contact, login animation) into Laravel.
- **Cleanup.** Whether to delete `React/` and `JustStretch/` once one build is chosen.

Setup instructions for the Laravel build are in [`laravel/README.md`](laravel/README.md).
