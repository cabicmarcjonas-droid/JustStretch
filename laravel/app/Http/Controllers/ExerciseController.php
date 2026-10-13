<?php

namespace App\Http\Controllers;

use App\Enums\BodyArea;
use App\Enums\Difficulty;
use App\Http\Requests\StoreExerciseRequest;
use App\Http\Requests\UpdateExerciseRequest;
use App\Models\Exercise;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\View\View;

class ExerciseController extends Controller
{
    public function index(Request $request): View
    {
        $filters = [
            'search' => $request->string('search')->trim()->toString(),
            'area' => $request->string('area')->toString(),
            'difficulty' => $request->string('difficulty')->toString(),
        ];

        $exercises = Exercise::query()
            ->search($filters['search'])
            ->forArea($filters['area'])
            ->ofDifficulty($filters['difficulty'])
            ->with('author')
            ->latest()
            ->paginate(9)
            ->withQueryString();

        return view('exercises.index', [
            'exercises' => $exercises,
            'filters' => $filters,
            'hasFilters' => array_filter($filters) !== [],
            'areas' => BodyArea::options(),
            'difficulties' => Difficulty::options(),
        ]);
    }

    public function create(): View
    {
        return view('exercises.create', [
            'exercise' => new Exercise,
            'areas' => BodyArea::options(),
            'difficulties' => Difficulty::options(),
        ]);
    }

    public function store(StoreExerciseRequest $request): RedirectResponse
    {
        $exercise = $request->user()->exercises()->create($request->validated());

        return redirect()
            ->route('exercises.index')
            ->with('status', "\"{$exercise->title}\" was added to the library.");
    }

    public function show(Request $request, Exercise $exercise): View
    {
        $exercise->load('author');

        $recentSessions = $request->user()
            ->stretchSessions()
            ->whereBelongsTo($exercise)
            ->latest('completed_at')
            ->take(5)
            ->get();

        return view('exercises.show', [
            'exercise' => $exercise,
            'recentSessions' => $recentSessions,
        ]);
    }

    public function edit(Exercise $exercise): View
    {
        Gate::authorize('update', $exercise);

        return view('exercises.edit', [
            'exercise' => $exercise,
            'areas' => BodyArea::options(),
            'difficulties' => Difficulty::options(),
        ]);
    }

    public function update(UpdateExerciseRequest $request, Exercise $exercise): RedirectResponse
    {
        Gate::authorize('update', $exercise);

        $exercise->update($request->validated());

        return redirect()
            ->route('exercises.show', $exercise)
            ->with('status', 'Your changes were saved.');
    }

    public function destroy(Exercise $exercise): RedirectResponse
    {
        Gate::authorize('delete', $exercise);

        $title = $exercise->title;
        $exercise->delete();

        return redirect()
            ->route('exercises.index')
            ->with('status', "\"{$title}\" was removed from the library.");
    }
}
