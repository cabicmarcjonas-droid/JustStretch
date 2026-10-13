<?php

namespace App\Enums;

enum Difficulty: string
{
    case Beginner = 'beginner';
    case Intermediate = 'intermediate';
    case Advanced = 'advanced';

    public function label(): string
    {
        return match ($this) {
            self::Beginner => 'Beginner',
            self::Intermediate => 'Intermediate',
            self::Advanced => 'Advanced',
        };
    }

    /**
     * Tailwind classes for the difficulty badge.
     */
    public function badgeClasses(): string
    {
        return match ($this) {
            self::Beginner => 'bg-accent-soft text-accent-dark border-accent/20',
            self::Intermediate => 'bg-amber-50 text-amber-800 border-amber-200',
            self::Advanced => 'bg-rose-50 text-rose-800 border-rose-200',
        };
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
