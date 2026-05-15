<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->actingAs($this->admin);
    $this->withoutMiddleware([
        HandleInertiaRequests::class,
    ]);
});

it('lists the access administration page', function () {
    $user = User::factory()->create([
        'name' => 'API User',
        'email' => 'api@example.com',
    ]);

    $user->createToken('inventory-sync', ['inventory:read']);

    $this->get('/admin/access')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/access/index')
            ->where('users.data', fn ($users) => collect($users)->contains(fn (array $item) => $item['name'] === 'API User'))
            ->where('tokens.data.0.name', 'inventory-sync')
        );
});

it('creates an access token for a selected user', function () {
    $user = User::factory()->create();

    $response = $this->post('/admin/access', [
        'user_id' => $user->id,
    ]);

    $response
        ->assertRedirect('/admin/access')
        ->assertSessionHas('success', 'Access token created successfully.')
        ->assertSessionHas('plain_text_token');

    $token = $user->tokens()->latest('id')->first();
    $expectedTokenName = sprintf('token-%s-%s', $user->id, Str::slug($user->name));

    expect($token)->not->toBeNull()
        ->and($token->name)->toBe($expectedTokenName)
        ->and($token->abilities)->toBe(['*']);
});

it('revokes an access token', function () {
    $user = User::factory()->create();
    $plainTextToken = $user->createToken('crm-reader', ['crm:read']);

    $tokenId = $user->tokens()->latest('id')->value('id');

    $this->delete("/admin/access/{$tokenId}")
        ->assertRedirect('/admin/access')
        ->assertSessionHas('success', 'Access token revoked successfully.');

    expect($user->tokens()->whereKey($tokenId)->exists())->toBeFalse()
        ->and($plainTextToken->plainTextToken)->toBeString();
});
