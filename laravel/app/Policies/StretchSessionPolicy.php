<?php

namespace App\Policies;

use App\Models\StretchSession;
use App\Models\User;

class StretchSessionPolicy
{
    public function delete(User $user, StretchSession $stretchSession): bool
    {
        return $user->id === $stretchSession->user_id;
    }
}
