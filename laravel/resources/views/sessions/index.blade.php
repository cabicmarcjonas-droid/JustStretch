<x-app-layout>
    <x-slot name="title">My sessions</x-slot>

    <x-slot name="header">
        <h1 class="font-display text-3xl font-semibold">My sessions</h1>
        <p class="mt-1 text-sm text-muted">Every stretch you've completed, newest first. Only you can see this list.</p>
    </x-slot>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if ($practisedExercises->isNotEmpty())
            <form method="GET" action="{{ route('sessions.index') }}" class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label for="exercise" class="text-sm font-medium">Show</label>
                <select id="exercise" name="exercise" class="rounded-lg border-line bg-white text-ink shadow-sm focus:border-accent focus:ring-accent sm:w-72">
                    <option value="">All exercises</option>
                    @foreach ($practisedExercises as $id => $title)
                        <option value="{{ $id }}" @selected($exerciseId === $id)>{{ $title }}</option>
                    @endforeach
                </select>
                <button type="submit" class="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-ink text-white text-sm font-medium hover:bg-ink/85">Apply</button>
                @if ($exerciseId)
                    <a href="{{ route('sessions.index') }}" class="text-sm text-muted hover:text-ink">Clear</a>
                @endif
            </form>
        @endif

        @if ($sessions->isEmpty())
            @php($emptyMessage = $exerciseId ? 'No sessions for this exercise.' : "You haven't completed a session yet.")
            <x-empty-state
                :message="$emptyMessage"
                hint="Sessions you save after a guided stretch will appear here."
                :action-href="route('exercises.index')"
                action-label="Browse exercises"
            />
        @else
            <div class="overflow-x-auto rounded-2xl border border-line bg-white">
                <table class="min-w-full text-sm">
                    <thead class="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                        <tr>
                            <th scope="col" class="px-4 sm:px-5 py-3 font-medium">Exercise</th>
                            <th scope="col" class="px-3 py-3 font-medium">Score</th>
                            <th scope="col" class="px-3 py-3 font-medium hidden sm:table-cell">Duration</th>
                            <th scope="col" class="px-3 py-3 font-medium">Date</th>
                            <th scope="col" class="px-5 py-3 hidden sm:table-cell"><span class="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-line">
                        @foreach ($sessions as $session)
                            <tr class="align-top">
                                <td class="px-4 sm:px-5 py-4">
                                    <a href="{{ route('exercises.show', $session->exercise) }}" class="font-medium hover:text-accent">{{ $session->exercise->title }}</a>
                                    <p class="text-xs text-muted">{{ $session->exercise->target_area->label() }}</p>
                                    @if ($session->notes)
                                        <p class="mt-1 text-xs text-muted italic max-w-xs">“{{ $session->notes }}”</p>
                                    @endif
                                </td>
                                <td class="px-3 py-4"><x-score-badge :score="$session->score" /></td>
                                <td class="px-3 py-4 hidden sm:table-cell tabular-nums text-muted">{{ $session->formatted_duration }}</td>
                                <td class="px-3 py-4 whitespace-nowrap">
                                    {{ $session->completed_at->format('M j, Y') }}
                                    <p class="text-xs text-muted">{{ $session->completed_at->format('g:i A') }}</p>
                                    <div class="mt-2 sm:hidden">
                                        @include('sessions.partials.delete-form')
                                    </div>
                                </td>
                                <td class="px-5 py-4 text-right hidden sm:table-cell">
                                    @include('sessions.partials.delete-form')
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <div class="mt-6">
                {{ $sessions->links() }}
            </div>
        @endif
    </div>
</x-app-layout>
