<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Client;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
    $this->actingAs($this->admin);
    $this->withoutMiddleware([
        HandleInertiaRequests::class,
    ]);
});

it('lists users on the admin users index', function () {
    User::factory()->count(3)->create();

    $this->get('/admin/users')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('admin/users/index'));
});

it('shows a user\'s linked client in the response', function () {
    $user = User::factory()->create(['name' => 'Portal User']);
    Client::factory()->create(['user_id' => $user->id, 'name' => 'Jane Doe']);

    $this->get("/admin/users?search={$user->name}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->where('users.meta.total', 1)
            ->where('users.data.0.id', $user->id)
            ->where('users.data.0.client.name', 'Jane Doe')
        );
});

it('shows null client when user has no client record', function () {
    $user = User::factory()->create(['name' => 'Solo User']);

    $this->get("/admin/users?search={$user->name}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->where('users.meta.total', 1)
            ->where('users.data.0.id', $user->id)
            ->where('users.data.0.client', null)
        );
});

it('filters users to only those with a client record', function () {
    $userWithClient = User::factory()->create();
    Client::factory()->create(['user_id' => $userWithClient->id]);
    User::factory()->create(); // no client

    $this->get('/admin/users?type=clients')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->where('users.meta.total', 1)
        );
});

it('filters users to only those without a client record', function () {
    $userWithClient = User::factory()->create();
    Client::factory()->create(['user_id' => $userWithClient->id]);
    User::factory()->count(2)->create(); // no client

    $this->get('/admin/users?type=no_client')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->where('users.meta.total', 3) // 2 created + 1 admin
        );
});

it('searches users by name', function () {
    User::factory()->create(['name' => 'Alice Smith']);
    User::factory()->create(['name' => 'Bob Jones']);

    $this->get('/admin/users?search=Alice')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->where('users.meta.total', 1)
            ->where('users.data.0.name', 'Alice Smith')
        );
});

it('creates a user from the admin users page', function () {
    $response = $this->post('/admin/users', [
        'name' => 'API Consumer',
        'email' => 'api-consumer@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response
        ->assertRedirect('/admin/users')
        ->assertSessionHas('success', 'Usuario creado exitosamente.');

    $user = User::query()->where('email', 'api-consumer@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->name)->toBe('API Consumer');
});

it('requires authentication to access admin users', function () {
    $this->post('/logout');

    $this->get('/admin/users')->assertRedirect('/login');
});
