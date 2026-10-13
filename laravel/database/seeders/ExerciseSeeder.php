<?php

namespace Database\Seeders;

use App\Enums\BodyArea;
use App\Enums\Difficulty;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;

class ExerciseSeeder extends Seeder
{
    /**
     * Indexes in the curated list that are authored by the demo account,
     * so edit/delete can be demonstrated after logging in as the demo user.
     */
    private const DEMO_OWNED = [0, 4, 8];

    /**
     * Seed the library with curated stretches. Faker (via ExerciseFactory)
     * fills duration, benefits and precautions.
     */
    public function run(): void
    {
        $curated = $this->curated();

        $demo = User::where('email', UserSeeder::DEMO_EMAIL)->firstOrFail();
        $others = User::whereKeyNot($demo->id)->pluck('id');

        Exercise::factory()
            ->count(count($curated))
            ->sequence(fn (Sequence $sequence) => [
                ...$curated[$sequence->index],
                'user_id' => in_array($sequence->index, self::DEMO_OWNED, true)
                    ? $demo->id
                    : $others->random(),
            ])
            ->create();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function curated(): array
    {
        return [
            [
                'title' => 'Neck Side Tilt',
                'target_area' => BodyArea::Neck,
                'difficulty' => Difficulty::Beginner,
                'description' => 'Lengthens the muscles along the side of the neck that tighten when you look down at a screen for hours.',
                'instructions' => "Sit or stand tall with your shoulders relaxed.\nSlowly tilt your right ear toward your right shoulder without lifting the shoulder.\nHold for 20 seconds while breathing slowly.\nReturn to centre and repeat on the left side.",
                'video_url' => '/videos/neck_side_tilt.mp4',
            ],
            [
                'title' => 'Chin Tuck',
                'target_area' => BodyArea::Neck,
                'difficulty' => Difficulty::Beginner,
                'description' => 'Counters forward-head posture by gently drawing the head back over the spine.',
                'instructions' => "Sit or stand with your back straight and eyes looking forward.\nGlide your chin straight back as if making a double chin.\nHold for 5 seconds, feeling a stretch at the base of the skull.\nRelax and repeat 10 times.",
            ],
            [
                'title' => 'Shoulder Rolls',
                'target_area' => BodyArea::Shoulders,
                'difficulty' => Difficulty::Beginner,
                'description' => 'A simple warm-up that loosens the shoulders and upper trapezius after long periods at a desk.',
                'instructions' => "Stand with arms hanging loosely at your sides.\nLift both shoulders up toward your ears.\nRoll them back and down in a slow circle.\nDo 10 backward rolls, then 10 forward rolls.",
            ],
            [
                'title' => 'Cross-Body Shoulder Stretch',
                'target_area' => BodyArea::Shoulders,
                'difficulty' => Difficulty::Beginner,
                'description' => 'Stretches the back of the shoulder and the rear deltoid, which often tighten from carrying bags on one side.',
                'instructions' => "Stand tall and bring your right arm straight across your chest.\nUse your left forearm to gently press the right arm closer to your body.\nKeep the right shoulder down, away from your ear.\nHold for 30 seconds, then switch arms.",
                'video_url' => '/videos/cross_body_shoulder.mp4',
            ],
            [
                'title' => 'Doorway Chest Stretch',
                'target_area' => BodyArea::Chest,
                'difficulty' => Difficulty::Intermediate,
                'description' => 'Opens the chest and front of the shoulders to balance out rounded, hunched posture.',
                'instructions' => "Stand in a doorway and place your forearms on the frame, elbows at shoulder height.\nStep one foot forward through the doorway.\nLean your body forward until you feel a stretch across the chest.\nHold for 30 seconds, keeping your back straight.\nStep back and rest before repeating.",
            ],
            [
                'title' => 'Cat-Cow',
                'target_area' => BodyArea::UpperBack,
                'difficulty' => Difficulty::Beginner,
                'description' => 'A flowing movement between arching and rounding the spine that mobilises the upper and middle back.',
                'instructions' => "Start on hands and knees with wrists under shoulders and knees under hips.\nInhale, drop your belly and lift your chest and gaze (cow).\nExhale, round your back toward the ceiling and tuck your chin (cat).\nMove slowly between the two positions for 10 breaths.",
            ],
            [
                'title' => "Child's Pose",
                'target_area' => BodyArea::LowerBack,
                'difficulty' => Difficulty::Beginner,
                'description' => 'A resting stretch that gently lengthens the lower back and hips while calming the breath.',
                'instructions' => "Kneel on the floor with big toes touching and knees apart.\nSit your hips back toward your heels.\nWalk your hands forward and lower your chest toward the floor.\nRest your forehead down and breathe deeply for 30 to 60 seconds.",
            ],
            [
                'title' => 'Knee-to-Chest Stretch',
                'target_area' => BodyArea::LowerBack,
                'difficulty' => Difficulty::Beginner,
                'description' => 'Relieves tension in the lower back and glutes by drawing one knee toward the chest while lying down.',
                'instructions' => "Lie on your back with both knees bent and feet flat.\nHug your right knee toward your chest with both hands.\nKeep your lower back relaxed against the floor.\nHold for 30 seconds, then switch legs.",
            ],
            [
                'title' => 'Figure-Four Hip Stretch',
                'target_area' => BodyArea::Hips,
                'difficulty' => Difficulty::Intermediate,
                'description' => 'Targets the outer hip and piriformis, a common source of hip and buttock tightness.',
                'instructions' => "Lie on your back with both knees bent.\nCross your right ankle over your left knee to make a figure four.\nReach through and hold the back of your left thigh.\nGently pull the left leg toward you until you feel the right hip stretch.\nHold for 30 seconds, then switch sides.",
            ],
            [
                'title' => 'Seated Hamstring Stretch',
                'target_area' => BodyArea::Hamstrings,
                'difficulty' => Difficulty::Intermediate,
                'description' => 'Lengthens the back of the thighs, which can pull on the lower back when tight.',
                'instructions' => "Sit on the floor with your right leg straight and left foot against your inner right thigh.\nSit tall and hinge forward from the hips over the straight leg.\nReach toward your shin or ankle without rounding your back.\nHold for 30 seconds, then switch legs.",
            ],
            [
                'title' => 'Standing Quad Stretch',
                'target_area' => BodyArea::Quads,
                'difficulty' => Difficulty::Intermediate,
                'description' => 'Stretches the front of the thigh and hip flexors while also challenging balance.',
                'instructions' => "Stand next to a wall or chair for support.\nBend your right knee and hold your right ankle behind you.\nKeep your knees together and push your hips slightly forward.\nHold for 30 seconds, then switch legs.",
            ],
            [
                'title' => 'Wall Calf Stretch',
                'target_area' => BodyArea::Calves,
                'difficulty' => Difficulty::Beginner,
                'description' => 'Loosens tight calves that can contribute to foot, ankle and knee discomfort.',
                'instructions' => "Stand facing a wall with your hands on it at chest height.\nStep your right foot back and keep the heel pressed to the floor.\nBend your front knee and lean toward the wall.\nHold for 30 seconds, then switch legs.",
            ],
            [
                'title' => 'Wrist Flexor Stretch',
                'target_area' => BodyArea::Wrists,
                'difficulty' => Difficulty::Beginner,
                'description' => 'Relieves tension in the forearm and wrist from typing, phone use and gripping.',
                'instructions' => "Extend your right arm in front of you, palm facing up.\nUse your left hand to gently pull the right fingers down and back.\nKeep the elbow straight and shoulders relaxed.\nHold for 20 seconds, then switch hands.",
            ],
            [
                'title' => 'Overhead Side Bend',
                'target_area' => BodyArea::LowerBack,
                'difficulty' => Difficulty::Beginner,
                'description' => 'Stretches the sides of the trunk, from the hips up to the armpits, which stiffen after long hours of sitting.',
                'instructions' => "Stand tall with your feet hip-width apart.\nRaise both arms out to the sides and up until your hands meet above your head.\nKeeping your arms overhead, lean your upper body to the right as your hips shift slightly to the left.\nHold for a few slow breaths, then return to centre.\nRepeat on the left side, then lower your arms.",
                'video_url' => '/videos/overhead_side_bend.mp4',
            ],
            [
                'title' => 'Standing Hamstring Reach',
                'target_area' => BodyArea::Hamstrings,
                'difficulty' => Difficulty::Intermediate,
                'description' => 'Lengthens the back of the thighs from a standing position by hinging forward at the hips.',
                'instructions' => "Stand side-on to your camera with your feet hip-width apart.\nKeep your knees straight but not locked.\nHinge forward from the hips and let your arms hang toward your shins.\nHold for a few slow breaths without bouncing.\nRoll back up slowly to standing.",
                'video_url' => '/videos/standing_hamstring_reach.mp4',
            ],
        ];
    }
}
