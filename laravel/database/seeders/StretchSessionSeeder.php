<?php

namespace Database\Seeders;

use App\Models\Exercise;
use App\Models\StretchSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;

class StretchSessionSeeder extends Seeder
{
    private const TOTAL = 40;

    private const DEMO_SESSIONS = 12;

    /**
     * Seed session history, guaranteeing the demo user has enough to fill a dashboard.
     */
    public function run(): void
    {
        $demo = User::where('email', UserSeeder::DEMO_EMAIL)->firstOrFail();
        $others = User::whereKeyNot($demo->id)->pluck('id');
        $exercises = Exercise::pluck('id');

        StretchSession::factory()
            ->count(self::TOTAL)
            ->sequence(fn (Sequence $sequence) => [
                'user_id' => $sequence->index < self::DEMO_SESSIONS ? $demo->id : $others->random(),
                'exercise_id' => $exercises->random(),
            ])
            ->create();
    }
}
