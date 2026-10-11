<?php

namespace Database\Factories;

use App\Enums\BodyArea;
use App\Enums\Difficulty;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Title, description and instructions are generic here; ExerciseSeeder
 * overrides them with a curated list so seeded data reads like real advice.
 *
 * @extends Factory<Exercise>
 */
class ExerciseFactory extends Factory
{
    /**
     * @var list<string>
     */
    protected array $benefitPool = [
        'Relieves muscle tension',
        'Improves range of motion',
        'Supports better posture',
        'Reduces stiffness after sitting',
        'Eases mild chronic pain',
        'Improves blood flow',
        'Helps you unwind and breathe',
        'Builds body awareness',
        'Prepares muscles for activity',
        'Balances left and right sides',
    ];

    /**
     * @var list<string>
     */
    protected array $precautionPool = [
        'Stop if you feel sharp or shooting pain.',
        'Move slowly and never bounce into the stretch.',
        'Skip this stretch if you have a recent injury in this area.',
        'Keep breathing steadily; do not hold your breath.',
        'Stretch only to mild tension, never to pain.',
        'Check with a doctor first if you have had surgery here.',
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $area = fake()->randomElement(BodyArea::cases());

        return [
            'user_id' => User::factory(),
            'title' => $area->label().' Release Stretch',
            'target_area' => $area,
            'difficulty' => fake()->randomElement(Difficulty::cases()),
            'duration_minutes' => fake()->numberBetween(2, 10),
            'description' => 'A gentle stretch to loosen the '.strtolower($area->label()).' after long periods of sitting.',
            'instructions' => implode("\n", [
                'Sit or stand tall with relaxed shoulders.',
                'Ease into the stretch until you feel mild tension.',
                'Hold for 20 to 30 seconds while breathing slowly.',
                'Release and repeat on the other side.',
            ]),
            'benefits' => fake()->randomElements($this->benefitPool, 3),
            'precautions' => fake()->optional(0.6)->randomElement($this->precautionPool),
            'video_url' => null,
        ];
    }
}
