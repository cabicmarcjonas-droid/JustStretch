@props(['exercise'])

<article {{ $attributes->merge(['class' => 'group relative flex flex-col rounded-2xl border border-line bg-white p-5 transition hover:border-ink/40']) }}>
    <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-medium uppercase tracking-wide text-accent">{{ $exercise->target_area->label() }}</span>
        <x-difficulty-badge :difficulty="$exercise->difficulty" />
    </div>

    <h3 class="mt-3 font-display text-xl font-semibold leading-snug">
        <a href="{{ route('exercises.show', $exercise) }}" class="after:absolute after:inset-0 focus:outline-none">
            {{ $exercise->title }}
        </a>
    </h3>

    <p class="mt-2 text-sm text-muted line-clamp-3">{{ $exercise->description }}</p>

    <div class="mt-auto pt-5 flex items-center justify-between text-xs text-muted">
        <span class="inline-flex items-center gap-1.5">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l3.5 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ $exercise->duration_minutes }} min
        </span>
        <span class="truncate ms-3">by {{ $exercise->author->is(auth()->user()) ? 'you' : $exercise->author->name }}</span>
    </div>
</article>
