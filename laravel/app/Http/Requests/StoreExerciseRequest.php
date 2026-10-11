<?php

namespace App\Http\Requests;

use App\Enums\BodyArea;
use App\Enums\Difficulty;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExerciseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * The form always posts five benefit inputs; drop the ones left blank.
     */
    protected function prepareForValidation(): void
    {
        $benefits = $this->input('benefits');

        if (is_array($benefits)) {
            $this->merge([
                'benefits' => array_values(array_filter(
                    array_map(fn ($benefit) => is_string($benefit) ? trim($benefit) : $benefit, $benefits),
                    fn ($benefit) => $benefit !== null && $benefit !== '',
                )),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'target_area' => ['required', Rule::enum(BodyArea::class)],
            'difficulty' => ['required', Rule::enum(Difficulty::class)],
            'duration_minutes' => ['required', 'integer', 'between:1,30'],
            'description' => ['required', 'string', 'max:500'],
            'instructions' => ['required', 'string', 'max:2000'],
            'benefits' => ['required', 'array', 'min:1', 'max:5'],
            'benefits.*' => ['required', 'string', 'max:80'],
            'precautions' => ['nullable', 'string', 'max:300'],
            'video_url' => ['nullable', 'url', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'target_area' => 'target area',
            'duration_minutes' => 'duration',
            'benefits.*' => 'benefit',
            'video_url' => 'video URL',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'benefits.required' => 'Add at least one benefit.',
        ];
    }
}
