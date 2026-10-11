<?php

namespace App\Models;

use App\Enums\BodyArea;
use App\Enums\Difficulty;
use Database\Factories\ExerciseFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exercise extends Model
{
    /** @use HasFactory<ExerciseFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'target_area',
        'difficulty',
        'duration_minutes',
        'description',
        'instructions',
        'benefits',
        'precautions',
        'video_url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'target_area' => BodyArea::class,
            'difficulty' => Difficulty::class,
            'duration_minutes' => 'integer',
            'benefits' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return HasMany<StretchSession, $this>
     */
    public function stretchSessions(): HasMany
    {
        return $this->hasMany(StretchSession::class);
    }

    /**
     * @param  Builder<Exercise>  $query
     * @return Builder<Exercise>
     */
    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        $term = trim((string) $term);

        return $term === ''
            ? $query
            : $query->where('title', 'like', '%'.$term.'%');
    }

    /**
     * @param  Builder<Exercise>  $query
     * @return Builder<Exercise>
     */
    public function scopeForArea(Builder $query, ?string $area): Builder
    {
        return blank($area) ? $query : $query->where('target_area', $area);
    }

    /**
     * @param  Builder<Exercise>  $query
     * @return Builder<Exercise>
     */
    public function scopeOfDifficulty(Builder $query, ?string $difficulty): Builder
    {
        return blank($difficulty) ? $query : $query->where('difficulty', $difficulty);
    }

    /**
     * Whether video_url points straight at a file a <video> tag can play
     * (otherwise it is shown as an external link, e.g. YouTube).
     */
    public function hasPlayableVideo(): bool
    {
        $path = (string) parse_url((string) $this->video_url, PHP_URL_PATH);

        return (bool) preg_match('/\.(mp4|webm|ogg|mov)$/i', $path);
    }

    /**
     * The newline-separated instructions as a list of trimmed, non-empty steps.
     *
     * @return Attribute<list<string>, never>
     */
    protected function instructionSteps(): Attribute
    {
        return Attribute::get(fn (): array => array_values(array_filter(
            array_map('trim', preg_split('/\R/', (string) $this->instructions)),
            fn (string $line): bool => $line !== '',
        )));
    }
}
