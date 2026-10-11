<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStretchSessionRequest;
use App\Models\Exercise;
use App\Models\StretchSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\View\View;

class StretchSessionController extends Controller
{
    /**
     * The current user's own session history, optionally filtered to one exercise.
     */
    public function index(Request $request): View
    {
        $user = $request->user();
        $exerciseId = $request->integer('exercise') ?: null;

        $sessions = $user->stretchSessions()
            ->with('exercise')
            ->when($exerciseId, fn ($query) => $query->where('exercise_id', $exerciseId))
            ->latest('completed_at')
            ->paginate(15)
            ->withQueryString();

        $practisedExercises = Exercise::whereIn('id', $user->stretchSessions()->select('exercise_id'))
            ->orderBy('title')
            ->pluck('title', 'id');

        return view('sessions.index', [
            'sessions' => $sessions,
            'exerciseId' => $exerciseId,
            'practisedExercises' => $practisedExercises,
        ]);
    }

    /**
     * Webcam session page. Pose tracking runs entirely in the browser.
     */
    public function create(Exercise $exercise): View
    {
        return view('sessions.create', ['exercise' => $exercise]);
    }

    public function store(StoreStretchSessionRequest $request, Exercise $exercise): RedirectResponse
    {
        $request->user()->stretchSessions()->create([
            ...$request->validated(),
            'exercise_id' => $exercise->id,
            'completed_at' => now(),
        ]);

        return redirect()
            ->route('dashboard')
            ->with('status', "Session saved for \"{$exercise->title}\". Nice work!");
    }

    public function destroy(StretchSession $stretchSession): RedirectResponse
    {
        Gate::authorize('delete', $stretchSession);

        $stretchSession->delete();

        return back()->with('status', 'Session removed from your history.');
    }
}
