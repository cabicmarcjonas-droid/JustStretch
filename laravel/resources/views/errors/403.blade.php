<x-public-layout title="Not allowed">
    <section class="max-w-xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
        </div>
        <p class="mt-6 text-sm font-medium text-muted">Error 403</p>
        <h1 class="mt-2 font-display text-3xl sm:text-4xl font-semibold">You can't edit this</h1>
        <p class="mt-4 text-muted">
            Exercises in the library can only be changed or deleted by the member who added them.
            You can still view it and use it for your own sessions.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
            @auth
                <a href="{{ route('exercises.index') }}" class="inline-flex items-center px-5 py-3 rounded-full bg-accent text-white font-medium hover:bg-accent-dark">Back to the library</a>
                <a href="{{ route('dashboard') }}" class="inline-flex items-center px-5 py-3 rounded-full border border-line bg-white font-medium hover:border-ink">Dashboard</a>
            @else
                <a href="{{ route('home') }}" class="inline-flex items-center px-5 py-3 rounded-full bg-accent text-white font-medium hover:bg-accent-dark">Go home</a>
            @endauth
        </div>
    </section>
</x-public-layout>
