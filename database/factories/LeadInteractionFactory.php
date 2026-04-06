<?php

namespace Database\Factories;

use App\Models\Lead;
use App\Models\LeadInteraction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeadInteraction>
 */
class LeadInteractionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'lead_id' => Lead::factory(),
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['call', 'email', 'visit', 'whatsapp', 'other']),
            'notes' => fake()->paragraph(),
            'interacted_at' => fake()->dateTimeBetween('-30 days', 'now'),
        ];
    }
}
