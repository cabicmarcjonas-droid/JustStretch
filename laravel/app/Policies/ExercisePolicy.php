<?php

namespace App\Policies;

use App\Models\Exercise;
use App\Models\User;

/**
 * The library is community-contributed: any member can browse and add
 * exercises, but only the author may change or remove their own entry.
 */
class ExercisePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Exercise $exercise): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Exercise $exercise): bool
    {
        return $user->id === $exercise->user_id;
    }

    public function delete(User $user, Exercise $exercise): bool
    {
        return $user->id === $exercise->user_id;
    }
}
