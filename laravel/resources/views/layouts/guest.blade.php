<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Just Stretch') }}</title>

        <x-fonts />

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans text-ink antialiased bg-paper">
        <div class="min-h-screen flex flex-col sm:justify-center items-center px-4 py-10">
            <a href="{{ route('home') }}" class="flex items-center gap-3 text-ink">
                <x-application-logo class="w-11 h-11 text-accent" />
                <span class="font-display text-2xl font-semibold">Just Stretch</span>
            </a>

            <div class="w-full sm:max-w-md mt-8 px-6 py-8 bg-white border border-line rounded-2xl">
                {{ $slot }}
            </div>

            <a href="{{ route('home') }}" class="mt-6 text-sm text-muted hover:text-ink">&larr; Back to home</a>
        </div>
    </body>
</html>
