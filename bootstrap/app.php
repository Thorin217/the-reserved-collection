<?php

use App\Http\Middleware\EnsureIsAdmin;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['admin' => EnsureIsAdmin::class]);

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (ValidationException $exception, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error('Validation failed.', $exception->errors(), 422);
            }
        });

        $exceptions->render(function (AuthenticationException $exception, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error('Unauthenticated.', null, 401);
            }
        });

        $exceptions->render(function (AuthorizationException $exception, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error('This action is unauthorized.', null, 403);
            }
        });

        $exceptions->render(function (ModelNotFoundException $exception, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error('Resource not found.', null, 404);
            }
        });

        $exceptions->render(function (NotFoundHttpException $exception, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error('Endpoint not found.', null, 404);
            }
        });

        $exceptions->render(function (MethodNotAllowedHttpException $exception, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error('Method not allowed.', null, 405);
            }
        });

        $exceptions->render(function (Throwable $exception, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error(
                    config('app.debug') ? $exception->getMessage() : 'Server error.',
                    null,
                    500
                );
            }
        });
    })->create();
