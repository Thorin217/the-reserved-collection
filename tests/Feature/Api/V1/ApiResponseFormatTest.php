<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('returns the standardized error payload for unauthenticated api requests', function () {
    $this->getJson('/api/v1/leads')
        ->assertUnauthorized()
        ->assertJson([
            'status' => false,
            'message' => 'Unauthenticated.',
        ]);
});

it('returns the standardized error payload for validation errors', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/v1/leads', [])
        ->assertUnprocessable()
        ->assertJson([
            'status' => false,
            'message' => 'Validation failed.',
        ])
        ->assertJsonStructure([
            'status',
            'message',
            'errors',
        ]);
});
