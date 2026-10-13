<?php

namespace App\Enums;

enum BodyArea: string
{
    case Neck = 'neck';
    case Shoulders = 'shoulders';
    case Chest = 'chest';
    case UpperBack = 'upper_back';
    case LowerBack = 'lower_back';
    case Hips = 'hips';
    case Hamstrings = 'hamstrings';
    case Quads = 'quads';
    case Calves = 'calves';
    case Wrists = 'wrists';

    public function label(): string
    {
        return match ($this) {
            self::Neck => 'Neck',
            self::Shoulders => 'Shoulders',
            self::Chest => 'Chest',
            self::UpperBack => 'Upper Back',
            self::LowerBack => 'Lower Back',
            self::Hips => 'Hips',
            self::Hamstrings => 'Hamstrings',
            self::Quads => 'Quads',
            self::Calves => 'Calves',
            self::Wrists => 'Wrists',
        };
    }

    /**
     * MediaPipe Pose landmark indices to emphasise for this area.
     *
     * @return list<int>
     */
    public function landmarks(): array
    {
        return match ($this) {
            self::Neck => [0, 7, 8, 11, 12],
            self::Shoulders => [11, 12, 13, 14],
            self::Chest => [11, 12, 13, 14, 15, 16],
            self::UpperBack => [11, 12, 13, 14, 23, 24],
            self::LowerBack => [11, 12, 23, 24, 25, 26],
            self::Hips => [23, 24, 25, 26],
            self::Hamstrings, self::Quads => [23, 24, 25, 26, 27, 28],
            self::Calves => [25, 26, 27, 28, 29, 30, 31, 32],
            self::Wrists => [13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
        };
    }

    /**
     * Whether the finger skeleton (MediaPipe HandLandmarker) should be drawn
     * in the accent colour, i.e. the fingers are part of the target area.
     */
    public function highlightsHands(): bool
    {
        return $this === self::Wrists;
    }

    /**
     * @return array<string, string> value => label, for select inputs
     */
    public static function options(): array
    {
        $options = [];

        foreach (self::cases() as $case) {
            $options[$case->value] = $case->label();
        }

        return $options;
    }
}
