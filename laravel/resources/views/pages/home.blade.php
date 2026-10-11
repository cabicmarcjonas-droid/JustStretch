<x-public-layout>
    {{-- Hero --}}
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-20 sm:pb-24 grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
            <p class="text-sm font-medium text-accent tracking-wide uppercase">Guided stretching &amp; gentle rehab</p>
            <h1 class="mt-4 font-display text-4xl sm:text-5xl font-semibold leading-tight">
                Ease the everyday aches, one careful stretch at a time.
            </h1>
            <p class="mt-5 text-lg text-muted max-w-xl">
                Just Stretch pairs a library of simple, low-risk stretches with live pose tracking from your webcam,
                so you can see whether the right parts of your body are actually doing the work.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
                @auth
                    <a href="{{ route('dashboard') }}" class="inline-flex items-center px-5 py-3 rounded-full bg-accent text-white font-medium hover:bg-accent-dark">Go to your dashboard</a>
                @else
                    <a href="{{ route('register') }}" class="inline-flex items-center px-5 py-3 rounded-full bg-accent text-white font-medium hover:bg-accent-dark">Create a free account</a>
                    <a href="{{ route('login') }}" class="inline-flex items-center px-5 py-3 rounded-full border border-line bg-white font-medium hover:border-ink">I already have one</a>
                @endauth
            </div>
        </div>

        {{-- Illustrative pose-tracking panel (pure SVG, no photos) --}}
        <div class="rounded-3xl border border-line bg-white p-6 sm:p-8">
            <div class="flex items-center justify-between text-xs text-muted">
                <span class="inline-flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-accent"></span> Tracking</span>
                <span>Target area: Neck</span>
            </div>
            <svg viewBox="0 0 200 290" class="mx-auto mt-4 h-72 w-auto" aria-label="Illustration of a tracked body skeleton with neck joints highlighted" role="img">
                <g stroke="#c9cbc4" stroke-width="3" stroke-linecap="round">
                    <line x1="75" y1="88" x2="125" y2="88" />
                    <line x1="75" y1="88" x2="58" y2="130" />
                    <line x1="58" y1="130" x2="52" y2="170" />
                    <line x1="125" y1="88" x2="142" y2="130" />
                    <line x1="142" y1="130" x2="148" y2="170" />
                    <line x1="75" y1="88" x2="85" y2="165" />
                    <line x1="125" y1="88" x2="115" y2="165" />
                    <line x1="85" y1="165" x2="115" y2="165" />
                    <line x1="85" y1="165" x2="82" y2="220" />
                    <line x1="82" y1="220" x2="80" y2="272" />
                    <line x1="115" y1="165" x2="118" y2="220" />
                    <line x1="118" y1="220" x2="120" y2="272" />
                </g>
                <g fill="#6b6f69">
                    <circle cx="58" cy="130" r="3.5" /><circle cx="142" cy="130" r="3.5" />
                    <circle cx="52" cy="170" r="3.5" /><circle cx="148" cy="170" r="3.5" />
                    <circle cx="85" cy="165" r="3.5" /><circle cx="115" cy="165" r="3.5" />
                    <circle cx="82" cy="220" r="3.5" /><circle cx="118" cy="220" r="3.5" />
                    <circle cx="80" cy="272" r="3.5" /><circle cx="120" cy="272" r="3.5" />
                </g>
                <circle cx="104" cy="45" r="24" fill="none" stroke="#e4e4df" stroke-width="2" />
                <g fill="#3f6b52">
                    <circle cx="106" cy="48" r="6" />
                    <circle cx="84" cy="44" r="6" />
                    <circle cx="124" cy="44" r="6" />
                    <circle cx="75" cy="88" r="7" />
                    <circle cx="125" cy="88" r="7" />
                </g>
            </svg>
            <p class="mt-4 text-center text-sm text-muted">Highlighted joints follow the area you are stretching.</p>
        </div>
    </section>

    {{-- How it works --}}
    <section class="border-t border-line bg-white">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <h2 class="font-display text-3xl font-semibold">How it works</h2>
            <p class="mt-3 text-muted max-w-2xl">Three short steps, no equipment, no appointment needed.</p>

            <ol class="mt-10 grid gap-6 md:grid-cols-3">
                <li class="rounded-2xl border border-line bg-paper p-6">
                    <span class="font-display text-3xl text-accent">1</span>
                    <h3 class="mt-3 font-semibold text-lg">Pick what hurts</h3>
                    <p class="mt-2 text-sm text-muted">Filter the library by body area and difficulty to find a stretch that fits how you feel today.</p>
                </li>
                <li class="rounded-2xl border border-line bg-paper p-6">
                    <span class="font-display text-3xl text-accent">2</span>
                    <h3 class="mt-3 font-semibold text-lg">Stretch on camera</h3>
                    <p class="mt-2 text-sm text-muted">Turn on your webcam and follow the steps while a live skeleton highlights the joints that matter.</p>
                </li>
                <li class="rounded-2xl border border-line bg-paper p-6">
                    <span class="font-display text-3xl text-accent">3</span>
                    <h3 class="mt-3 font-semibold text-lg">Rate and track</h3>
                    <p class="mt-2 text-sm text-muted">Score your own form when you finish. Your dashboard shows minutes stretched and how your scores trend.</p>
                </li>
            </ol>
        </div>
    </section>

    {{-- Features --}}
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 class="font-display text-3xl font-semibold">What you get</h2>
        <div class="mt-10 grid gap-6 sm:grid-cols-2">
            <div class="rounded-2xl border border-line bg-white p-6">
                <h3 class="font-semibold">A growing exercise library</h3>
                <p class="mt-2 text-sm text-muted">Searchable stretches for the neck, back, hips, legs and wrists, each with clear steps, benefits and safety notes.</p>
            </div>
            <div class="rounded-2xl border border-line bg-white p-6">
                <h3 class="font-semibold">Live pose tracking</h3>
                <p class="mt-2 text-sm text-muted">MediaPipe Pose runs inside your browser and draws your skeleton in real time, emphasising the target joints.</p>
            </div>
            <div class="rounded-2xl border border-line bg-white p-6">
                <h3 class="font-semibold">Community contributed</h3>
                <p class="mt-2 text-sm text-muted">Any member can add a stretch they find helpful. Only the author can edit or remove it, so entries stay trustworthy.</p>
            </div>
            <div class="rounded-2xl border border-line bg-white p-6">
                <h3 class="font-semibold">Private by design</h3>
                <p class="mt-2 text-sm text-muted">Video never leaves your device. We only save the score, duration and notes you choose to submit.</p>
            </div>
        </div>
    </section>

    {{-- CTA --}}
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div class="rounded-3xl bg-ink text-white px-6 py-12 sm:px-12 text-center">
            <h2 class="font-display text-3xl font-semibold">Five minutes a day is a good start.</h2>
            <p class="mt-3 text-white/70 max-w-xl mx-auto">Set up an account and try your first guided stretch in under a minute.</p>
            @auth
                <a href="{{ route('dashboard') }}" class="mt-8 inline-flex items-center px-5 py-3 rounded-full bg-white text-ink font-medium hover:bg-paper">Open dashboard</a>
            @else
                <a href="{{ route('register') }}" class="mt-8 inline-flex items-center px-5 py-3 rounded-full bg-white text-ink font-medium hover:bg-paper">Get started</a>
            @endauth
        </div>
    </section>
</x-public-layout>
