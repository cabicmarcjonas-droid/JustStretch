<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\StretchSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StretchSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_session_page_renders_with_target_landmarks(): void
    {
        $exercise = Exercise::factory()->create(['target_area' => 'neck']);

        $this->actingAs(User::factory()->create())
            ->get(route('exercises.session', $exercise))
            ->assertOk()
            ->assertSee("data-landmarks='[0,7,8,11,12]'", false)
            ->assertSee('data-highlight-hands="false"', false);
    }

    public function test_wrist_exercises_highlight_the_finger_skeleton(): void
    {
        $exercise = Exercise::factory()->create(['target_area' => 'wrists']);

        $this->actingAs(User::factory()->create())
            ->get(route('exercises.session', $exercise))
            ->assertOk()
            ->assertSee('data-highlight-hands="true"', false);
    }

    public function test_authenticated_user_can_store_a_session_with_a_valid_score(): void
    {
        $user = User::factory()->create();
        $exercise = Exercise::factory()->create();

        $this->actingAs($user)
            ->post(route('exercises.sessions.store', $exercise), [
                'score' => 85,
                'duration_seconds' => 272,
                'notes' => 'Felt good.',
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('status');

        $session = StretchSession::firstOrFail();

        $this->assertSame($user->id, $session->user_id);
        $this->assertSame($exercise->id, $session->exercise_id);
        $this->assertSame(85, $session->score);
        $this->assertNotNull($session->completed_at);
        $this->assertSame('4m 32s', $session->formatted_duration);
    }

    public function test_score_above_100_fails_validation(): void
    {
        $exercise = Exercise::factory()->create();

        $this->actingAs(User::factory()->create())
            ->post(route('exercises.sessions.store', $exercise), ['score' => 150])
            ->assertSessionHasErrors('score');

        $this->assertDatabaseCount('stretch_sessions', 0);
    }

    public function test_history_lists_only_the_current_users_sessions(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        StretchSession::factory()->for($user)->create(['notes' => 'my own session note']);
        StretchSession::factory()->for($other)->create(['notes' => 'someone else private note']);

        $this->actingAs($user)
            ->get(route('sessions.index'))
            ->assertOk()
            ->assertSee('my own session note')
            ->assertDontSee('someone else private note');
    }

    public function test_user_cannot_delete_another_users_session(): void
    {
        $session = StretchSession::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('sessions.destroy', $session))
            ->assertForbidden();

        $this->assertModelExists($session);
    }

    public function test_dashboard_shows_empty_state_for_a_new_account(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('dashboard'))
            ->assertOk()
            ->assertSee('No sessions yet')
            ->assertSee('Browse exercises');
    }
}
