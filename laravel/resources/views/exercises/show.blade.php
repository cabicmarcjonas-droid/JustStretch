<x-app-layout>
    <x-slot name="title">{{ $exercise->title }}</x-slot>

    <x-slot name="header">
        <a href="{{ route('exercises.index') }}" class="text-sm text-muted hover:text-ink">&larr; Exercise library</a>
        <div class="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
                <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs font-medium uppercase tracking-wide text-accent">{{ $exercise->target_area->label() }}</span>
                    <x-difficulty-badge :difficulty="$exercise->difficulty" />
                    <span class="text-xs text-muted">· {{ $exercise->duration_minutes }} min</span>
                </div>
                <h1 class="mt-2 font-display text-3xl sm:text-4xl font-semibold">{{ $exercise->title }}</h1>
                <p class="mt-1 text-sm text-muted">
                    Added by {{ $exercise->author->is(auth()->user()) ? 'you' : $exercise->author->name }}
                    · {{ $exercise->created_at->format('M j, Y') }}
                </p>
            </div>

            @can('update', $exercise)
                <div class="flex gap-2">
                    <a href="{{ route('exercises.edit', $exercise) }}" class="inline-flex items-center justify-center px-4 py-2.5 rounded-full border border-line bg-white text-sm font-medium hover:border-ink">Edit</a>
                    @can('delete', $exercise)
                        <x-danger-button type="button" x-data="" x-on:click.prevent="$dispatch('open-modal', 'confirm-exercise-deletion')">
                            Delete
                        </x-danger-button>
                    @endcan
                </div>
            @endcan
        </div>
    </x-slot>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div class="space-y-8 min-w-0">
            @if ($exercise->video_url && $exercise->hasPlayableVideo())
                <video src="{{ $exercise->video_url }}" controls preload="metadata" class="w-full aspect-video rounded-2xl border border-line bg-ink"></video>
            @else
                <div class="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-line bg-white text-center px-6">
                    <svg class="h-10 w-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    @if ($exercise->video_url)
                        <p class="mt-3 font-medium">Demo video</p>
                        <a href="{{ $exercise->video_url }}" target="_blank" rel="noopener noreferrer" class="mt-1 text-sm text-accent underline underline-offset-2 break-all">Watch on the original site</a>
                    @else
                        <p class="mt-3 font-medium">Demo video coming soon</p>
                        <p class="mt-1 text-sm text-muted">Follow the written steps below in the meantime.</p>
                    @endif
                </div>
            @endif

            <section>
                <h2 class="font-display text-2xl font-semibold">About this stretch</h2>
                <p class="mt-3 text-muted leading-relaxed">{{ $exercise->description }}</p>
            </section>

            <section>
                <h2 class="font-display text-2xl font-semibold">Steps</h2>
                <ol class="mt-4 space-y-3">
                    @foreach ($exercise->instruction_steps as $step)
                        <li class="flex gap-4">
                            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-dark">{{ $loop->iteration }}</span>
                            <span class="pt-0.5">{{ $step }}</span>
                        </li>
                    @endforeach
                </ol>
            </section>

            <section>
                <h2 class="font-display text-2xl font-semibold">Benefits</h2>
                <ul class="mt-4 grid gap-2 sm:grid-cols-2">
                    @foreach ($exercise->benefits as $benefit)
                        <li class="flex items-start gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm">
                            <svg class="h-5 w-5 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                            {{ $benefit }}
                        </li>
                    @endforeach
                </ul>
            </section>

            @if ($exercise->precautions)
                <section class="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900" role="note">
                    <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008M10.29 3.86L1.82 18a1.5 1.5 0 001.29 2.25h17.78A1.5 1.5 0 0022.18 18L13.71 3.86a1.5 1.5 0 00-2.42 0z" /></svg>
                    <div>
                        <h2 class="font-semibold">Precautions</h2>
                        <p class="mt-1 text-sm">{{ $exercise->precautions }}</p>
                    </div>
                </section>
            @endif
        </div>

        <aside class="space-y-6">
            <div class="rounded-2xl border border-line bg-white p-5">
                <h2 class="font-semibold">Ready to try it?</h2>
                <p class="mt-1 text-sm text-muted">Your webcam shows a live skeleton with the {{ strtolower($exercise->target_area->label()) }} joints highlighted.</p>
                <a href="{{ route('exercises.session', $exercise) }}" class="mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-3 rounded-full bg-accent text-white font-medium hover:bg-accent-dark">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86A1 1 0 008 5.14z" /></svg>
                    Start session
                </a>
            </div>

            <div class="rounded-2xl border border-line bg-white p-5">
                <h2 class="font-semibold">Your recent attempts</h2>
                @if ($recentSessions->isEmpty())
                    <p class="mt-2 text-sm text-muted">You haven't tried this stretch yet.</p>
                @else
                    <ul class="mt-3 divide-y divide-line">
                        @foreach ($recentSessions as $session)
                            <li class="flex items-center justify-between gap-3 py-2.5 text-sm">
                                <div>
                                    <p>{{ $session->completed_at->format('M j, Y') }}</p>
                                    <p class="text-xs text-muted">{{ $session->formatted_duration }}</p>
                                </div>
                                <x-score-badge :score="$session->score" />
                            </li>
                        @endforeach
                    </ul>
                @endif
            </div>
        </aside>
    </div>

    @can('delete', $exercise)
        <x-modal name="confirm-exercise-deletion" focusable>
            <form method="POST" action="{{ route('exercises.destroy', $exercise) }}" class="p-6">
                @csrf
                @method('DELETE')

                <h2 class="font-display text-xl font-semibold">Delete “{{ $exercise->title }}”?</h2>
                <p class="mt-2 text-sm text-muted">
                    This removes the exercise from the library for everyone, along with every session logged against it. This cannot be undone.
                </p>

                <div class="mt-6 flex justify-end gap-3">
                    <x-secondary-button x-on:click="$dispatch('close')">Cancel</x-secondary-button>
                    <x-danger-button>Delete exercise</x-danger-button>
                </div>
            </form>
        </x-modal>
    @endcan
</x-app-layout>
