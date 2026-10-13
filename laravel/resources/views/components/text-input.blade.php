@props(['disabled' => false])

<input @disabled($disabled) {{ $attributes->merge(['class' => 'border-line bg-white text-ink placeholder:text-muted/70 focus:border-accent focus:ring-accent rounded-lg shadow-sm']) }}>
