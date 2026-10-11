<?php

namespace App\Http\Controllers;

use App\Enums\BodyArea;
use App\Models\Exercise;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    /**
     * Personal summary: headline stats, recent sessions and a few suggestions.
     */
    public function __invoke(Request $request): View
    {
        $user = $request->user();
        $sessions = $user->stretchSessions();

        $averageScore = (clone $sessions)
            ->where('completed_at', '>=', now()->subDays(7))
            ->avg('score');

        $secondsThisWeek = (clone $sessions)
            ->where('completed_at', '>=', now()->startOfWeek())
            ->sum('duration_seconds');

        $topArea = (clone $sessions)
            ->join('exercises', 'exercises.id', '=', 'stretch_sessions.exercise_id')
            ->select('exercises.target_area')
            ->selectRaw('count(*) as total')
            ->groupBy('exercises.target_area')
            ->orderByDesc('total')
            ->first();

        $triedIds = (clone $sessions)->distinct()->pluck('exercise_id');

        $suggestions = Exercise::whereNotIn('id', $triedIds)->inRandomOrder()->take(3)->get();

        if ($suggestions->isEmpty()) {
            $suggestions = Exercise::inRandomOrder()->take(3)->get();
        }

        return view('dashboard', [
            'totalSessions' => (clone $sessions)->count(),
            'averageScore' => $averageScore === null ? null : (int) round($averageScore),
            'minutesThisWeek' => intdiv((int) $secondsThisWeek, 60),
            'topArea' => $topArea ? BodyArea::tryFrom($topArea->target_area) : null,
            'recentSessions' => (clone $sessions)->with('exercise')->latest('completed_at')->take(5)->get(),
            'suggestions' => $suggestions->load('author'),
        ]);
    }
}
