<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public const DEMO_EMAIL = 'demo@juststretch.test';

    /**
     * One known demo account, two named accounts, and seven Faker-generated users.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Demo User',
            'email' => self::DEMO_EMAIL,
            'password' => 'password',
        ]);

        User::factory()->create([
            'name' => 'Miguel Estallo',
            'email' => 'miguel.estallo@example.net',
            'password' => 'password',
        ]);

        User::factory()->create([
            'name' => 'Rene Baterbonia',
            'email' => 'rene.baterbonia@gmail.com',
            'password' => 'password',
        ]);

        User::factory()->count(7)->create();
    }
}
