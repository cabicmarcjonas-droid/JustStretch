<x-app-layout>
    <x-slot name="title">Exercise library</x-slot>

    <x-slot name="header">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 class="font-display text-3xl font-semibold">Exercise library</h1>
                <p class="mt-1 text-sm text-muted">Gentle stretches shared by the Just Stretch community.</p>
            </div>
            <a href="{{ route('exercises.create') }}" class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-dark">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M12 5v14M5 12h14" /></svg>
                Add exercise
            </a>
        </div>
    </x-slot>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form method="GET" action="{{ route('exercises.index') }}" class="rounded-2xl border border-line bg-white p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_auto]" role="search">
            <div>
                <label for="search" class="sr-only">Search by title</label>
                <x-text-input id="search" name="search" type="search" class="w-full" placeholder="Search by title…" :value="$filters['search']" />
            </div>
            <div>
                <label for="area" class="sr-only">Body area</label>
                <select id="area" name="area" class="w-full rounded-lg border-line bg-white text-ink shadow-sm focus:border-accent focus:ring-accent">
                    <option value="">All body areas</option>
                    @foreach ($areas as $value => $label)
                        <option value="{{ $value }}" @selected($filters['area'] === $value)>{{ $label }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label for="difficulty" class="sr-only">Difficulty</label>
                <select id="difficulty" name="difficulty" class="w-full rounded-lg border-line bg-white text-ink shadow-sm focus:border-accent focus:ring-accent">
                    <option value="">Any difficulty</option>
                    @foreach ($difficulties as $value => $label)
                        <option value="{{ $value }}" @selected($filters['difficulty'] === $value)>{{ $label }}</option>
                    @endforeach
                </select>
            </div>
            <div class="flex items-center gap-3">
                <button type="submit" class="inline-flex flex-1 lg:flex-none items-center justify-center px-5 py-2.5 rounded-full bg-ink text-white text-sm font-medium hover:bg-ink/85">Filter</button>
                @if ($hasFilters)
                    <a href="{{ route('exercises.index') }}" class="text-sm text-muted hover:text-ink whitespace-nowrap">Clear</a>
                @endif
            </div>
        </form>

        <p class="mt-6 text-sm text-muted">
            {{ $exercises->total() }} {{ Str::plural('exercise', $exercises->total()) }}
            @if ($hasFilters)
                {{ $exercises->total() === 1 ? 'matches' : 'match' }} your filters
            @else
                in the library
            @endif
        </p>

        @if ($exercises->isEmpty() && ! $hasFilters)
            <x-empty-state
                class="mt-4"
                message="The library is empty"
                hint="Be the first to share a stretch that helps you."
                :action-href="route('exercises.create')"
                action-label="Add exercise"
            />
        @elseif ($exercises->isEmpty())
            <x-empty-state
                class="mt-4"
                message="No exercises match your filters"
                hint="Try a different search term or widen the body area and difficulty."
                :action-href="route('exercises.index')"
                action-label="Clear filters"
            >
                <x-slot name="icon">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" /></svg>
                </x-slot>
            </x-empty-state>
        @else
            <div class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                @foreach ($exercises as $exercise)
                    <x-exercise-card :exercise="$exercise" />
                @endforeach
            </div>

            <div class="mt-8">
                {{ $exercises->links() }}
            </div>
        @endif
    </div>
</x-app-layout>
