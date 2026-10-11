<x-app-layout>
    <x-slot name="title">Edit {{ $exercise->title }}</x-slot>

    <x-slot name="header">
        <a href="{{ route('exercises.show', $exercise) }}" class="text-sm text-muted hover:text-ink">&larr; Back to exercise</a>
        <h1 class="mt-3 font-display text-3xl font-semibold">Edit “{{ $exercise->title }}”</h1>
    </x-slot>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form method="POST" action="{{ route('exercises.update', $exercise) }}" class="space-y-6" novalidate>
            @csrf
            @method('PUT')

            @include('exercises.partials.form', ['submitLabel' => 'Save changes'])
        </form>
    </div>
</x-app-layout>
