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
            <header x-data="{ open: false }" class="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-40">
                <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <a href="{{ route('home') }}" class="flex items-center gap-2.5">
                        <x-application-logo class="w-8 h-8 text-accent" />
                        <span class="font-display text-xl font-semibold">Just Stretch</span>
                    </a>

                    <nav class="hidden sm:flex items-center gap-6 text-sm">
                        <a href="{{ route('about') }}" class="{{ request()->routeIs('about') ? 'text-ink font-medium' : 'text-muted hover:text-ink' }}">About</a>
                        @auth
                            <a href="{{ route('dashboard') }}" class="inline-flex items-center px-4 py-2 rounded-full bg-ink text-white font-medium hover:bg-ink/85">Dashboard</a>
                        @else
                            <a href="{{ route('login') }}" class="text-muted hover:text-ink">Log in</a>
                            <a href="{{ route('register') }}" class="inline-flex items-center px-4 py-2 rounded-full bg-ink text-white font-medium hover:bg-ink/85">Register</a>
                        @endauth
                    </nav>

                    <button type="button" @click="open = ! open" class="sm:hidden p-2 -me-2 rounded-md text-muted hover:text-ink" aria-label="Toggle menu">
                        <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                            <path x-show="! open" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            <path x-show="open" x-cloak stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav x-show="open" x-cloak class="sm:hidden border-t border-line px-4 py-3 space-y-1 text-sm">
                    <a href="{{ route('about') }}" class="block py-2 text-ink">About</a>
                    @auth
                        <a href="{{ route('dashboard') }}" class="block py-2 text-ink">Dashboard</a>
                    @else
                        <a href="{{ route('login') }}" class="block py-2 text-ink">Log in</a>
                        <a href="{{ route('register') }}" class="block py-2 text-accent font-medium">Register</a>
                    @endauth
                </nav>
            </header>

            <main class="flex-1">
                {{ $slot }}
            </main>

            <footer class="border-t border-line">
                <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-6 sm:grid-cols-3 text-sm">
                    <div>
                        <div class="flex items-center gap-2">
                            <x-application-logo class="w-6 h-6 text-accent" />
                            <span class="font-display font-semibold">Just Stretch</span>
                        </div>
                        <p class="mt-2 text-muted">Guided stretching for everyday aches, right in your browser.</p>
                    </div>
                    <div class="space-y-2">
                        <p class="font-medium">Explore</p>
                        <a href="{{ route('home') }}" class="block text-muted hover:text-ink">Home</a>
                        <a href="{{ route('about') }}" class="block text-muted hover:text-ink">About</a>
                        @guest
                            <a href="{{ route('register') }}" class="block text-muted hover:text-ink">Create an account</a>
                        @endguest
                    </div>
                    <p class="text-muted sm:text-right">
                        Not a substitute for medical advice.
                    </p>
                </div>
            </footer>
        </div>
    </body>
</html>
