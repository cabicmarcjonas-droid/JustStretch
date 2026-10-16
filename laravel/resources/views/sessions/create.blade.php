<x-app-layout>
    <x-slot name="title">Session · {{ $exercise->title }}</x-slot>
 
    <x-slot name="header">
        <a href="{{ route('exercises.show', $exercise) }}" class="text-sm text-muted hover:text-ink">&larr; Back to exercise</a>
        <div class="mt-3 flex flex-wrap items-center gap-2">
            <span class="text-xs font-medium uppercase tracking-wide text-accent">{{ $exercise->target_area->label() }}</span>
            <x-difficulty-badge :difficulty="$exercise->difficulty" />
        </div>
        <h1 class="mt-2 font-display text-3xl font-semibold">{{ $exercise->title }}</h1>
    </x-slot>
 
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div class="grid gap-8 lg:grid-cols-[20rem_1fr]">
            {{-- Left: what to do --}}
            <aside class="space-y-6 order-2 lg:order-1">
                <section class="rounded-2xl border border-line bg-white p-5">
                    <h2 class="font-semibold">Steps</h2>
                    <ol class="mt-3 space-y-3 text-sm">
                        @foreach ($exercise->instruction_steps as $step)
                            <li class="flex gap-3">
                                <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-dark">{{ $loop->iteration }}</span>
                                <span>{{ $step }}</span>
                            </li>
                        @endforeach
                    </ol>
                </section>
 
                @if ($exercise->precautions)
                    <section class="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" role="note">
                        <h2 class="font-semibold">Precautions</h2>
                        <p class="mt-1">{{ $exercise->precautions }}</p>
                    </section>
                @endif
 
                <section class="rounded-2xl border border-line bg-white p-5 text-sm">
                    <h2 class="font-semibold">Joints highlighted</h2>
                    <p class="mt-1 text-muted">
                        Joints for the <strong class="text-ink">{{ strtolower($exercise->target_area->label()) }}</strong>
                        are drawn larger in green. The rest of the skeleton is shown in grey.
                    </p>
                    <p class="mt-2 text-muted">
                        @if ($exercise->target_area->highlightsHands())
                            Your fingers are tracked too (21 points per hand) and drawn in green for this stretch.
                        @else
                            Your fingers are tracked too, shown in grey.
                        @endif
                    </p>
                </section>
            </aside>
 
            {{-- Right: camera --}}
            <section class="order-1 lg:order-2 min-w-0">
                <div id="pose-stage"
                     class="relative overflow-hidden rounded-2xl border border-line bg-ink"
                     data-video-url="{{ $exercise->video_url }}"
                     data-landmarks='@json($exercise->target_area->landmarks())'
                     data-highlight-hands="{{ $exercise->target_area->highlightsHands() ? 'true' : 'false' }}">
                    <video id="pose-video" class="hidden" playsinline muted></video>
                    <canvas id="pose-canvas" width="640" height="480" class="block w-full h-auto aspect-[4/3] -scale-x-100"></canvas>
 
                    <div id="pose-overlay" class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white/80 bg-ink/70">
                        <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        <p class="text-sm">Camera is off. Press <strong class="text-white">Start</strong> to begin.</p>
                    </div>
                </div>
 
                <div class="mt-4 flex flex-wrap items-center gap-3">
                    <button id="pose-start" type="button" disabled
                            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed">
                        Start
                    </button>
                    <button id="pose-stop" type="button" disabled
                            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-line bg-white text-sm font-medium hover:border-ink disabled:opacity-50 disabled:cursor-not-allowed">
                        Stop
                    </button>
                    <span class="ms-auto inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm">
                        <span class="text-muted">Elapsed</span>
                        <span id="pose-timer" class="font-semibold tabular-nums">00:00</span>
                    </span>
                </div>
 
                <p id="pose-status" role="status" aria-live="polite" data-tone="muted"
                   class="mt-3 text-sm text-muted data-[tone=ok]:text-accent data-[tone=warn]:text-amber-700 data-[tone=error]:text-red-700">
                    Loading pose model…
                </p>

                {{-- Live results: filled in by pose-tracker.js while a session is running --}}
                <div id="pose-live" class="hidden mt-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
                    <div class="flex items-end justify-between gap-4">
                        <div>
                            <h2 class="font-semibold">Live form</h2>
                            <p id="pose-live-frames" class="text-xs text-muted"></p>
                        </div>
                        <span id="pose-live-score" class="font-display text-4xl font-semibold tabular-nums text-accent">—</span>
                    </div>
                    <p id="pose-live-note" class="mt-2 text-xs text-muted"></p>
                    <table id="pose-live-table" class="mt-3 w-full text-sm">
                        <thead class="text-xs text-muted">
                            <tr>
                                <th class="py-1 text-left font-medium">Joint</th>
                                <th class="py-1 px-2 text-right font-medium">You</th>
                                <th class="py-1 px-2 text-right font-medium">Target</th>
                                <th class="py-1 px-2 text-right font-medium">Off by</th>
                                <th class="py-1 pl-2"><span class="sr-only">Status</span></th>
                            </tr>
                        </thead>
                        <tbody id="pose-live-rows" class="divide-y divide-line"></tbody>
                    </table>
                </div>
 
                <p class="mt-3 flex items-start gap-2 text-xs text-muted">
                    <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    Privacy: pose tracking runs only in this browser tab. No video frames or body landmarks are sent to the server. Only your score, the session length and any notes are saved.
                </p>
            </section>
        </div>
 
        {{-- Score form: revealed by the session-ended event fired from pose-tracker.js --}}
        <section x-data="{ open: @js($errors->any()), score: @js(old('score') !== null ? (int) old('score') : null), seconds: @js(old('duration_seconds')), auto: false, summary: null }"
                 x-on:session-ended.window="seconds = $event.detail.seconds; summary = $event.detail.summary ?? null; if ($event.detail.score != null) { score = $event.detail.score; auto = true }; open = true; $nextTick(() => $el.scrollIntoView({ behavior: 'smooth', block: 'start' }))"
                 x-show="open"
                 x-cloak
                 x-transition.opacity
                 class="rounded-2xl border border-line bg-white p-6 sm:p-8 scroll-mt-6">
            <h2 class="font-display text-2xl font-semibold">How did it go?</h2>
            <p class="mt-1 text-sm text-muted">
                Session length: <span class="font-medium text-ink tabular-nums" x-text="seconds !== null && seconds !== '' ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : '—'"></span>
            </p>
 
            {{-- Tracking results: filled in by the session-ended event --}}
            <div x-show="summary" x-cloak class="mt-6 rounded-xl border border-line bg-stone-50 p-5">
                <template x-if="summary && summary.hasReference && summary.judgedFrames >= summary.minJudgedFrames">
                    <div>
                        <div class="flex items-end justify-between gap-4">
                            <div>
                                <h3 class="font-semibold">Tracking results</h3>
                                <p class="text-sm text-muted">
                                    <span class="font-medium text-ink tabular-nums" x-text="summary.goodFrames"></span>
                                    of
                                    <span class="tabular-nums" x-text="summary.judgedFrames"></span>
                                    judged frames were within the margin of error.
                                </p>
                            </div>
                            <span class="font-display text-4xl font-semibold tabular-nums text-accent"
                                  x-text="`${Math.round(100 * summary.goodFrames / summary.judgedFrames)}%`"></span>
                        </div>

                        <div class="mt-4 overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="text-xs text-muted">
                                    <tr>
                                        <th class="py-1 text-left font-medium">Joint</th>
                                        <th class="py-1 text-right font-medium">Average error</th>
                                        <th class="py-1 text-right font-medium">Time in range</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template x-for="j in summary.joints" :key="j.name">
                                        <tr class="border-t border-line">
                                            <td class="py-2 capitalize" x-text="j.name.replace(/_/g, ' ')"></td>
                                            <td class="py-2 text-right tabular-nums" x-text="`${j.meanErrorDeg.toFixed(1)}°`"></td>
                                            <td class="py-2 text-right font-medium tabular-nums"
                                                :class="j.inRangePct >= 80 ? 'text-accent' : 'text-red-700'"
                                                x-text="`${j.inRangePct}%`"></td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </template>

                <template x-if="summary && !(summary.hasReference && summary.judgedFrames >= summary.minJudgedFrames)">
                    <div class="text-sm">
                        <h3 class="font-semibold">No tracking score for this session</h3>
                        <p class="mt-1 text-muted"
                           x-text="!summary.hasReference
                               ? 'This exercise has no reference pose yet, so rate your form yourself below.'
                               : `Only ${summary.judgedFrames} frames could be judged (at least ${summary.minJudgedFrames} are needed). Keep your upper body fully in view and try again.`"></p>
                        <p class="mt-1 text-muted" x-show="summary.hasReference && summary.camera"
                           x-text="summary.camera === 'Cam_Side' ? 'This stretch is tracked from the side: stand sideways to the camera.' : 'This stretch is tracked from the front: face the camera.'"></p>
                    </div>
                </template>
            </div>

            <form method="POST" action="{{ route('exercises.sessions.store', $exercise) }}" class="mt-6 space-y-6">
                @csrf
                <input type="hidden" name="duration_seconds" :value="seconds">
 
                <div>
                    <div class="flex items-end justify-between">
                        <x-input-label for="score" value="Form score" />
                        <span class="font-display text-3xl font-semibold tabular-nums text-accent" x-text="score"></span>
                    </div>
                    <p class="text-xs text-muted">How well did you hold the form? 0 = couldn't do it, 100 = perfect.</p>
                    <p x-show="auto" x-cloak class="text-xs text-accent">Suggested from your camera tracking. You can adjust it before saving.</p>
                    <input id="score" name="score" type="range" min="0" max="100" step="1" x-model.number="score"
                           class="mt-3 w-full accent-[#3f6b52]">
                    <div class="flex justify-between text-xs text-muted"><span>0</span><span>50</span><span>100</span></div>
                    <x-input-error :messages="$errors->get('score')" class="mt-2" />
                    <x-input-error :messages="$errors->get('duration_seconds')" class="mt-2" />
                </div>
 
                <div>
                    <x-input-label for="notes" value="Notes (optional)" />
                    <textarea id="notes" name="notes" rows="3" maxlength="500"
                              class="mt-1 block w-full rounded-lg border-line bg-white text-ink shadow-sm placeholder:text-muted/70 focus:border-accent focus:ring-accent"
                              placeholder="e.g. Left side felt tighter than the right.">{{ old('notes') }}</textarea>
                    <x-input-error :messages="$errors->get('notes')" class="mt-2" />
                </div>
 
                <div class="flex justify-end">
                    <x-primary-button>Save session</x-primary-button>
                </div>
            </form>
        </section>
    </div>
 
    @push('scripts')
        @vite('resources/js/pose-tracker.js')
    @endpush
</x-app-layout>