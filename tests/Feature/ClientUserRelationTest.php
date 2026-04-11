<?php

use App\Models\Client;
use App\Models\User;

test('a client can be linked to a user', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);

    expect($client->user)->toBeInstanceOf(User::class)
        ->and($client->user->id)->toBe($user->id);
});

test('a user can access their linked client', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);

    expect($user->client)->toBeInstanceOf(Client::class)
        ->and($user->client->id)->toBe($client->id);
});

test('a client can exist without a linked user', function () {
    $client = Client::factory()->create(['user_id' => null]);

    expect($client->user)->toBeNull();
});

test('deleting a user nullifies the client user_id', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);

    $user->delete();

    expect($client->fresh()->user_id)->toBeNull();
});
