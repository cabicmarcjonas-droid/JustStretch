<x-app-layout>
    <x-slot name="title">Add exercise</x-slot>

    <x-slot name="header">
        <a href="{{ route('exercises.index') }}" class="text-sm text-muted hover:text-ink">&larr; Exercise library</a>
        <h1 class="mt-3 font-display text-3xl font-semibold">Add an exercise</h1>
        <p class="mt-1 text-sm text-muted">Share a stretch that helps you. You can edit or remove it later; other members can't.</p>
    </x-slot>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form method="POST" action="{{ route('exercises.store') }}" class="space-y-6" novalidate>
            @csrf

            @include('exercises.partials.form', ['submitLabel' => 'Add to library'])
        </form>
    </div>
</x-app-layout>
