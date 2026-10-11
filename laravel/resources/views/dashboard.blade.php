<x-app-layout>
    <x-slot name="title">Dashboard</x-slot>

    <x-slot name="header">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p class="text-sm text-muted">{{ now()->format('l, F j') }}</p>
                <h1 class="mt-1 font-display text-3xl font-semibold">Hi, {{ Str::before(Auth::user()->name, ' ') }}</h1>
            </div>
            <a href="{{ route('exercises.index') }}" class="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-dark">Find a stretch</a>
        </div>
    </x-slot>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {{-- Stat cards --}}
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div class="rounded-2xl border border-line bg-white p-5">
                <p class="text-xs font-medium uppercase tracking-wide text-muted">Total sessions</p>
                <p class="mt-2 font-display text-3xl font-semibold tabular-nums">{{ $totalSessions }}</p>
            </div>
            <div class="rounded-2xl border border-line bg-white p-5">
                <p class="text-xs font-medium uppercase tracking-wide text-muted">Avg. score · 7 days</p>
                <p class="mt-2 font-display text-3xl font-semibold tabular-nums">{{ $averageScore ?? '—' }}</p>
            </div>
            <div class="rounded-2xl border border-line bg-white p-5">
                <p class="text-xs font-medium uppercase tracking-wide text-muted">Minutes this week</p>
                <p class="mt-2 font-display text-3xl font-semibold tabular-nums">{{ $minutesThisWeek }}</p>
            </div>
            <div class="rounded-2xl border border-line bg-white p-5">
                <p class="text-xs font-medium uppercase tracking-wide text-muted">Most practised</p>
                <p class="mt-2 font-display text-2xl sm:text-3xl font-semibold">{{ $topArea?->label() ?? '—' }}</p>
            </div>
        </div>

        <div class="grid gap-8 lg:grid-cols-[1fr_22rem]">
            {{-- Recent sessions --}}
            <section class="min-w-0">
                <div class="flex items-center justify-between">
                    <h2 class="font-display text-2xl font-semibold">Recent sessions</h2>
                    @if ($recentSessions->isNotEmpty())
                        <a href="{{ route('sessions.index') }}" class="text-sm text-accent hover:text-accent-dark">View all</a>
                    @endif
                </div>

                @if ($recentSessions->isEmpty())
                    <x-empty-state
                        class="mt-4"
                        message="No sessions yet"
                        hint="Pick a stretch from the library and start your first guided session."
                        :action-href="route('exercises.index')"
                        action-label="Browse exercises"
                    />
                @else
                    <ul class="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
                        @foreach ($recentSessions as $session)
                            <li class="flex items-center justify-between gap-4 px-5 py-4">
                                <div class="min-w-0">
                                    <a href="{{ route('exercises.show', $session->exercise) }}" class="font-medium hover:text-accent truncate block">{{ $session->exercise->title }}</a>
                                    <p class="text-xs text-muted">
                                        {{ $session->exercise->target_area->label() }}
                                        · {{ $session->formatted_duration }}
                                        · {{ $session->completed_at->diffForHumans() }}
                                    </p>
                                </div>
                                <x-score-badge :score="$session->score" />
                            </li>
                        @endforeach
                    </ul>
                @endif
            </section>

            {{-- Suggestions --}}
            <section>
                <h2 class="font-display text-2xl font-semibold">Try something new</h2>
                @if ($suggestions->isEmpty())
                    <p class="mt-4 text-sm text-muted">The library is empty. <a href="{{ route('exercises.create') }}" class="text-accent underline">Add the first exercise</a>.</p>
                @else
                    <div class="mt-4 space-y-4">
                        @foreach ($suggestions as $exercise)
                            <x-exercise-card :exercise="$exercise" />
                        @endforeach
                    </div>
                @endif
            </section>
        </div>
    </div>
</x-app-layout>
