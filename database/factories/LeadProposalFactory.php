<?php

namespace Database\Factories;

use App\Enums\ProposalStatus;
use App\Models\Lead;
use App\Models\LeadProposal;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LeadProposal>
 */
class LeadProposalFactory extends Factory
{
    public function definition(): array
    {
        return [
            'lead_id' => Lead::factory(),
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'notes' => fake()->optional(0.5)->paragraph(),
            'status' => ProposalStatus::Draft->value,
            'sent_via' => null,
            'sent_at' => null,
        ];
    }

    public function sent(): static
    {
        return $this->state([
            'status' => ProposalStatus::Sent->value,
            'sent_via' => fake()->randomElement(['whatsapp', 'email']),
            'sent_at' => now(),
        ]);
    }

    public function accepted(): static
    {
        return $this->state([
            'status' => ProposalStatus::Accepted->value,
            'sent_via' => fake()->randomElement(['whatsapp', 'email']),
            'sent_at' => now()->subDays(2),
        ]);
    }
}
