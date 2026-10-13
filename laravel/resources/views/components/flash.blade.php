@if (session('status'))
    <div x-data="{ show: true }"
         x-init="setTimeout(() => show = false, 4000)"
         x-show="show"
         x-transition.opacity.duration.300ms
         class="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6"
         role="status">
        <div class="flex items-start justify-between gap-4 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-dark">
            <p>{{ session('status') }}</p>
            <button type="button" @click="show = false" class="shrink-0 text-lg leading-none text-accent-dark/70 hover:text-accent-dark" aria-label="Dismiss">&times;</button>
        </div>
    </div>
@endif
