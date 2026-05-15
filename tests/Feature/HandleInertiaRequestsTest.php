<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

it('shares access token flash data with inertia', function () {
    Cache::shouldReceive('remember')
        ->once()
        ->andReturn([]);

    $request = Request::create('/admin/access', 'GET');
    $request->setLaravelSession(app('session.store'));
    $request->session()->put('plain_text_token', 'plain-text-token');
    $request->session()->put('created_token_name', 'warehouse-sync');
    $request->session()->put('created_token_user', 'API User');
    $request->setUserResolver(fn () => null);

    $shared = (new HandleInertiaRequests)->share($request);

    expect($shared['flash']['plain_text_token'])->toBe('plain-text-token')
        ->and($shared['flash']['created_token_name'])->toBe('warehouse-sync')
        ->and($shared['flash']['created_token_user'])->toBe('API User');
});
