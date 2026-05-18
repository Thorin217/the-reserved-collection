<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreTokenRequest;
use App\Http\Resources\AccessTokenResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Sanctum\PersonalAccessToken;

class TokenController extends Controller
{
    public function index(Request $request): Response
    {
        $tokens = PersonalAccessToken::query()
            ->where('tokenable_type', $request->user()::class)
            ->where('tokenable_id', $request->user()->id)
            ->latest('id')
            ->get();

        return Inertia::render('settings/tokens', [
            'tokens' => AccessTokenResource::collection($tokens),
            'status' => session('status'),
        ]);
    }

    public function store(StoreTokenRequest $request): RedirectResponse
    {
        $name = Str::slug($request->validated('name'));
        $token = $request->user()->createToken($name);

        return to_route('tokens.index')
            ->with('status', 'token-created')
            ->with('plain_text_token', $token->plainTextToken)
            ->with('created_token_name', $name);
    }

    public function destroy(Request $request, PersonalAccessToken $token): RedirectResponse
    {
        abort_unless(
            $token->tokenable_type === $request->user()::class && $token->tokenable_id === $request->user()->id,
            403
        );

        $token->delete();

        return to_route('tokens.index')->with('status', 'token-revoked');
    }
}
