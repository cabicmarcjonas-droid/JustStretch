<?php

namespace App\Http\Requests;

/**
 * Same rules as creating an exercise; only the author may submit it.
 */
class UpdateExerciseRequest extends StoreExerciseRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('exercise'));
    }
}
