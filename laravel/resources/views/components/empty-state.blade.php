@props([
    'message',
    'hint' => null,
    'actionHref' => null,
    'actionLabel' => null,
])

<div {{ $attributes->merge(['class' => 'flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-line bg-white px-6 py-12']) }}>
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        @if (isset($icon) && $icon->isNotEmpty())
            {{ $icon }}
        @else
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l3.5 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        @endif
    </div>

    <p class="mt-4 font-medium text-ink">{{ $message }}</p>

    @if ($hint)
        <p class="mt-1 text-sm text-muted max-w-sm">{{ $hint }}</p>
    @endif

    @if ($actionHref && $actionLabel)
        <a href="{{ $actionHref }}" class="mt-5 inline-flex items-center px-4 py-2 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-dark">
            {{ $actionLabel }}
        </a>
    @endif
</div>
