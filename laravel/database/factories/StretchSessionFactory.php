<?php

namespace Database\Factories;

use App\Models\Exercise;
use App\Models\StretchSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StretchSession>
 */
class StretchSessionFactory extends Factory
{
    /**
     * Realistic self-notes; Faker's Latin sentences read oddly in a health app.
     *
     * @var list<string>
     */
    protected array $notePool = [
        'Left side felt tighter than the right.',
        'Much easier than last time.',
        'Neck still a bit stiff after work.',
        'Held each side for the full 30 seconds.',
        'Felt a mild pull, no pain.',
        'Need to keep my shoulders down next time.',
        'Did this after a long study session.',
        'Breathing slowly helped a lot.',
        'Lost balance once, will use a chair next time.',
        'Back felt looser afterwards.',
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'exercise_id' => Exercise::factory(),
            'score' => fake()->numberBetween(35, 98),
            'duration_seconds' => fake()->numberBetween(60, 600),
            'notes' => fake()->optional(0.4)->randomElement($this->notePool),
            'completed_at' => fake()->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
