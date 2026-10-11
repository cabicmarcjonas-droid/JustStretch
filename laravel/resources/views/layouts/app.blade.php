<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ isset($title) ? $title.' · ' : '' }}{{ config('app.name', 'Just Stretch') }}</title>

        <x-fonts />

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans antialiased bg-paper text-ink">
        <div class="min-h-screen flex flex-col">
            @include('layouts.navigation')

            @isset($header)
                <header class="bg-white border-b border-line">
                    <div class="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                        {{ $header }}
                    </div>
                </header>
            @endisset

            <x-flash />

            <main class="flex-1">
                {{ $slot }}
            </main>

            <footer class="border-t border-line">
                <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-xs text-muted">
                    Just Stretch is a guide, not a diagnosis. Stop any stretch that causes sharp pain and consult a professional.
                </div>
            </footer>
        </div>

        @stack('scripts')
    </body>
</html>
