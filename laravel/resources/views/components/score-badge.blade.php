@props(['score'])

@php
    $classes = match (true) {
        $score >= 80 => 'bg-accent text-white border-accent',
        $score >= 50 => 'bg-amber-100 text-amber-900 border-amber-200',
        default => 'bg-paper text-muted border-line',
    };
@endphp

<span {{ $attributes->merge(['class' => 'inline-flex items-center justify-center min-w-[3rem] rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums '.$classes]) }}>
    {{ $score }}
</span>
