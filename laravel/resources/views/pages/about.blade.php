<x-public-layout title="About">
    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 sm:pt-20">
        <p class="text-sm font-medium text-accent tracking-wide uppercase">About the project</p>
        <h1 class="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight">Why Just Stretch exists</h1>
        <p class="mt-5 text-lg text-muted">
            Many people live with a stiff neck or a sore lower back for months because seeing a physiotherapist
            is expensive, far away, or hard to fit into a working week. Just Stretch is a small step toward closing that gap.
        </p>
    </section>

    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <div>
            <h2 class="font-display text-2xl font-semibold">The problem</h2>
            <ul class="mt-4 space-y-3 text-muted list-disc ps-5">
                <li>Minor chronic muscle pain is common among students and desk workers, and it often goes untreated.</li>
                <li>Professional physiotherapy costs money and travel time that many people cannot spare for a "minor" ache.</li>
                <li>Following a stretch from a static picture or video gives no feedback, so people are never sure they are doing it right.</li>
            </ul>
        </div>

        <div>
            <h2 class="font-display text-2xl font-semibold">Our approach</h2>
            <p class="mt-4 text-muted">
                Just Stretch offers a curated, community-maintained library of gentle stretches grouped by body area.
                When you start a session, your webcam feed is analysed in the browser by a pose-estimation model. The joints
                that matter for that stretch are highlighted, giving you a live mirror of your own posture. Afterwards you rate
                your form and the app keeps a simple history so you can see your consistency improve.
            </p>
        </div>

        <div>
            <h2 class="font-display text-2xl font-semibold">Sustainable Development Goals</h2>
            <div class="mt-4 grid gap-4 sm:grid-cols-3">
                <div class="rounded-2xl border border-line bg-white p-5">
                    <p class="font-display text-3xl text-accent">3</p>
                    <p class="mt-1 font-semibold">Good Health &amp; Well-being</p>
                    <p class="mt-2 text-sm text-muted">Encourages regular, safe movement to manage everyday musculoskeletal pain.</p>
                </div>
                <div class="rounded-2xl border border-line bg-white p-5">
                    <p class="font-display text-3xl text-accent">10</p>
                    <p class="mt-1 font-semibold">Reduced Inequalities</p>
                    <p class="mt-2 text-sm text-muted">Free guidance that only needs a browser and a webcam, not a clinic visit.</p>
                </div>
                <div class="rounded-2xl border border-line bg-white p-5">
                    <p class="font-display text-3xl text-accent">17</p>
                    <p class="mt-1 font-semibold">Partnerships for the Goals</p>
                    <p class="mt-2 text-sm text-muted">Members contribute exercises to a shared, open library that anyone can learn from.</p>
                </div>
            </div>
        </div>

        <div>
            <h2 class="font-display text-2xl font-semibold">Built with</h2>
            <dl class="mt-4 divide-y divide-line rounded-2xl border border-line bg-white text-sm">
                <div class="flex justify-between gap-4 px-5 py-3"><dt class="font-medium">Backend</dt><dd class="text-muted text-right">Laravel 13 on PHP 8.5</dd></div>
                <div class="flex justify-between gap-4 px-5 py-3"><dt class="font-medium">Database</dt><dd class="text-muted text-right">SQLite</dd></div>
                <div class="flex justify-between gap-4 px-5 py-3"><dt class="font-medium">Authentication</dt><dd class="text-muted text-right">Laravel Breeze (Blade + Alpine.js)</dd></div>
                <div class="flex justify-between gap-4 px-5 py-3"><dt class="font-medium">Styling</dt><dd class="text-muted text-right">Tailwind CSS</dd></div>
                <div class="flex justify-between gap-4 px-5 py-3"><dt class="font-medium">Pose tracking</dt><dd class="text-muted text-right">MediaPipe Tasks Vision (PoseLandmarker)</dd></div>
                <div class="flex justify-between gap-4 px-5 py-3"><dt class="font-medium">Build tool</dt><dd class="text-muted text-right">Vite</dd></div>
            </dl>
        </div>

        <div class="rounded-2xl border border-accent/30 bg-accent-soft p-6">
            <h2 class="font-display text-2xl font-semibold text-accent-dark">Your privacy</h2>
            <p class="mt-3 text-accent-dark/90">
                The pose model runs entirely inside your browser. Camera frames and body landmarks are never uploaded or stored.
                The only session data sent to our server is what you type or choose yourself: a form score, the session length and optional notes.
            </p>
        </div>

        <p class="text-sm text-muted">
            Just Stretch is a student project and is not a medical device. If a stretch causes sharp or worsening pain, stop and seek professional advice.
        </p>
    </section>
</x-public-layout>
