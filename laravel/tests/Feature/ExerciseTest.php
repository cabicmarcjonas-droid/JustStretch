<?php

namespace Tests\Feature;

use App\Enums\BodyArea;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExerciseTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Seated Spinal Twist',
            'target_area' => 'upper_back',
            'difficulty' => 'beginner',
            'duration_minutes' => 4,
            'description' => 'A gentle seated rotation for the middle back.',
            'instructions' => "Sit tall.\nTurn to the right.\nHold, then switch sides.",
            'benefits' => ['Improves spinal mobility', '', 'Eases desk stiffness', '', ''],
            'precautions' => 'Stop if you feel sharp pain.',
            'video_url' => null,
        ], $overrides);
    }

    public function test_guests_are_redirected_to_login_from_the_library(): void
    {
        $this->get('/exercises')->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_the_library(): void
    {
        Exercise::factory()->create(['title' => 'Chin Tuck']);

        $this->actingAs(User::factory()->create())
            ->get('/exercises')
            ->assertOk()
            ->assertSee('Chin Tuck');
    }

    public function test_library_filters_by_search_area_and_difficulty(): void
    {
        Exercise::factory()->create(['title' => 'Chin Tuck', 'target_area' => 'neck', 'difficulty' => 'beginner']);
        Exercise::factory()->create(['title' => 'Neck Side Tilt', 'target_area' => 'neck', 'difficulty' => 'advanced']);
        Exercise::factory()->create(['title' => 'Wall Calf Stretch', 'target_area' => 'calves', 'difficulty' => 'beginner']);

        $this->actingAs(User::factory()->create())
            ->get('/exercises?search=tilt&area=neck&difficulty=advanced')
            ->assertOk()
            ->assertSee('Neck Side Tilt')
            ->assertDontSee('Chin Tuck')
            ->assertDontSee('Wall Calf Stretch');
    }

    public function test_authenticated_user_can_create_an_exercise(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/exercises', $this->validPayload())
            ->assertRedirect(route('exercises.index'))
            ->assertSessionHas('status');

        $exercise = Exercise::firstOrFail();

        $this->assertSame($user->id, $exercise->user_id);
        $this->assertSame(BodyArea::UpperBack, $exercise->target_area);
        $this->assertSame(['Improves spinal mobility', 'Eases desk stiffness'], $exercise->benefits);
        $this->assertCount(3, $exercise->instruction_steps);
    }

    public function test_validation_rejects_missing_title_and_invalid_target_area(): void
    {
        $this->actingAs(User::factory()->create())
            ->post('/exercises', $this->validPayload(['title' => '', 'target_area' => 'elbows']))
            ->assertSessionHasErrors(['title', 'target_area']);

        $this->assertDatabaseCount('exercises', 0);
    }

    public function test_validation_requires_at_least_one_benefit(): void
    {
        $this->actingAs(User::factory()->create())
            ->post('/exercises', $this->validPayload(['benefits' => ['', '', '', '', '']]))
            ->assertSessionHasErrors('benefits');
    }

    public function test_user_cannot_edit_update_or_delete_another_users_exercise(): void
    {
        $exercise = Exercise::factory()->create(['title' => 'Original Title']);
        $intruder = User::factory()->create();

        $this->actingAs($intruder)->get(route('exercises.edit', $exercise))->assertForbidden();

        $this->actingAs($intruder)
            ->put(route('exercises.update', $exercise), $this->validPayload(['title' => 'Hijacked']))
            ->assertForbidden();

        $this->actingAs($intruder)
            ->delete(route('exercises.destroy', $exercise))
            ->assertForbidden();

        $this->assertDatabaseHas('exercises', ['id' => $exercise->id, 'title' => 'Original Title']);
    }

    public function test_author_can_update_their_exercise(): void
    {
        $exercise = Exercise::factory()->create();

        $this->actingAs($exercise->author)
            ->put(route('exercises.update', $exercise), $this->validPayload(['title' => 'Renamed Stretch']))
            ->assertRedirect(route('exercises.show', $exercise))
            ->assertSessionHas('status');

        $this->assertSame('Renamed Stretch', $exercise->fresh()->title);
    }

    public function test_author_can_delete_their_exercise(): void
    {
        $exercise = Exercise::factory()->create();

        $this->actingAs($exercise->author)
            ->delete(route('exercises.destroy', $exercise))
            ->assertRedirect(route('exercises.index'));

        $this->assertModelMissing($exercise);
    }

    public function test_edit_and_delete_buttons_only_show_for_the_author(): void
    {
        $exercise = Exercise::factory()->create();
        $editUrl = route('exercises.edit', $exercise);

        $this->actingAs($exercise->author)->get(route('exercises.show', $exercise))->assertSee($editUrl);
        $this->actingAs(User::factory()->create())->get(route('exercises.show', $exercise))->assertDontSee($editUrl);
    }
}
