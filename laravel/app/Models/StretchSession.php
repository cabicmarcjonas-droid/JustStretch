<?php

namespace App\Models;

use Database\Factories\StretchSessionFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StretchSession extends Model
{
    /** @use HasFactory<StretchSessionFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'exercise_id',
        'score',
        'duration_seconds',
        'notes',
        'completed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'duration_seconds' => 'integer',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Exercise, $this>
     */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    /**
     * Human-readable duration, e.g. "4m 32s"; "—" when no duration was recorded.
     *
     * @return Attribute<string, never>
     */
    protected function formattedDuration(): Attribute
    {
        return Attribute::get(function (): string {
            if ($this->duration_seconds === null) {
                return '—';
            }

            $minutes = intdiv($this->duration_seconds, 60);
            $seconds = $this->duration_seconds % 60;

            return $minutes > 0 ? "{$minutes}m {$seconds}s" : "{$seconds}s";
        });
    }
}
