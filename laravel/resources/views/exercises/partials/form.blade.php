{{-- Shared by create and edit. Expects $exercise (new or existing), $areas, $difficulties, $submitLabel. --}}
@php
    $selectClasses = 'mt-1 block w-full rounded-lg border-line bg-white text-ink shadow-sm focus:border-accent focus:ring-accent';
    $textareaClasses = 'mt-1 block w-full rounded-lg border-line bg-white text-ink shadow-sm placeholder:text-muted/70 focus:border-accent focus:ring-accent';
    $benefits = old('benefits', $exercise->benefits ?? []);
@endphp

@if ($errors->any())
    <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
        Please fix the {{ Str::plural('field', $errors->count()) }} highlighted below.
    </div>
@endif

<div class="rounded-2xl border border-line bg-white p-6 space-y-6">
    <h2 class="font-display text-xl font-semibold">Basics</h2>

    <div>
        <x-input-label for="title" value="Title" />
        <x-text-input id="title" name="title" type="text" class="mt-1 block w-full" maxlength="120" :value="old('title', $exercise->title)" placeholder="e.g. Seated Spinal Twist" />
        <x-input-error :messages="$errors->get('title')" class="mt-2" />
    </div>

    <div class="grid gap-6 sm:grid-cols-3">
        <div>
            <x-input-label for="target_area" value="Target area" />
            <select id="target_area" name="target_area" class="{{ $selectClasses }}">
                <option value="">Choose…</option>
                @foreach ($areas as $value => $label)
                    <option value="{{ $value }}" @selected(old('target_area', $exercise->target_area?->value) === $value)>{{ $label }}</option>
                @endforeach
            </select>
            <x-input-error :messages="$errors->get('target_area')" class="mt-2" />
        </div>

        <div>
            <x-input-label for="difficulty" value="Difficulty" />
            <select id="difficulty" name="difficulty" class="{{ $selectClasses }}">
                <option value="">Choose…</option>
                @foreach ($difficulties as $value => $label)
                    <option value="{{ $value }}" @selected(old('difficulty', $exercise->difficulty?->value) === $value)>{{ $label }}</option>
                @endforeach
            </select>
            <x-input-error :messages="$errors->get('difficulty')" class="mt-2" />
        </div>

        <div>
            <x-input-label for="duration_minutes" value="Duration (minutes)" />
            <x-text-input id="duration_minutes" name="duration_minutes" type="number" min="1" max="30" class="mt-1 block w-full" :value="old('duration_minutes', $exercise->duration_minutes)" />
            <x-input-error :messages="$errors->get('duration_minutes')" class="mt-2" />
        </div>
    </div>

    <div>
        <x-input-label for="description" value="Short description" />
        <textarea id="description" name="description" rows="3" maxlength="500" class="{{ $textareaClasses }}" placeholder="One or two sentences about what this stretch helps with.">{{ old('description', $exercise->description) }}</textarea>
        <x-input-error :messages="$errors->get('description')" class="mt-2" />
    </div>
</div>

<div class="rounded-2xl border border-line bg-white p-6 space-y-6">
    <h2 class="font-display text-xl font-semibold">How to do it</h2>

    <div>
        <x-input-label for="instructions" value="Instructions" />
        <p class="text-xs text-muted">Put each step on its own line. They will be shown as a numbered list.</p>
        <textarea id="instructions" name="instructions" rows="6" maxlength="2000" class="{{ $textareaClasses }}" placeholder="Sit tall on a chair.&#10;Turn your upper body to the right.&#10;Hold for 20 seconds, then switch sides.">{{ old('instructions', $exercise->instructions) }}</textarea>
        <x-input-error :messages="$errors->get('instructions')" class="mt-2" />
    </div>

    <fieldset>
        <legend class="block font-medium text-sm text-ink">Benefits</legend>
        <p class="text-xs text-muted">Between one and five short benefits. Leave unused boxes empty.</p>
        <div class="mt-2 grid gap-2 sm:grid-cols-2">
            @for ($i = 0; $i < 5; $i++)
                <div>
                    <label for="benefit_{{ $i }}" class="sr-only">Benefit {{ $i + 1 }}</label>
                    <x-text-input id="benefit_{{ $i }}" name="benefits[]" type="text" maxlength="80" class="block w-full" :value="$benefits[$i] ?? ''" placeholder="Benefit {{ $i + 1 }}" />
                    <x-input-error :messages="$errors->get('benefits.'.$i)" class="mt-1" />
                </div>
            @endfor
        </div>
        <x-input-error :messages="$errors->get('benefits')" class="mt-2" />
    </fieldset>

    <div>
        <x-input-label for="precautions" value="Precautions (optional)" />
        <textarea id="precautions" name="precautions" rows="2" maxlength="300" class="{{ $textareaClasses }}" placeholder="e.g. Stop if you feel sharp pain.">{{ old('precautions', $exercise->precautions) }}</textarea>
        <x-input-error :messages="$errors->get('precautions')" class="mt-2" />
    </div>

    <div>
        <x-input-label for="video_url" value="Demo video URL (optional)" />
        <x-text-input id="video_url" name="video_url" type="url" maxlength="255" class="mt-1 block w-full" :value="old('video_url', $exercise->video_url)" placeholder="https://…" />
        <x-input-error :messages="$errors->get('video_url')" class="mt-2" />
    </div>
</div>

<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
    <a href="{{ $exercise->exists ? route('exercises.show', $exercise) : route('exercises.index') }}" class="inline-flex items-center justify-center px-4 py-2.5 rounded-full border border-line bg-white text-sm font-medium hover:border-ink">Cancel</a>
    <x-primary-button>{{ $submitLabel }}</x-primary-button>
</div>
