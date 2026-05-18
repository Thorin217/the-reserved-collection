<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAccessTokenRequest;
use App\Http\Resources\AccessTokenResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Sanctum\PersonalAccessToken;

class AccessController extends Controller
{
    public function index(Request $request): Response
    {
        $tokens = PersonalAccessToken::query()
            ->where('tokenable_type', User::class)
            ->with('tokenable')
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function ($innerQuery) use ($search): void {
                    $innerQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhereHasMorph('tokenable', [User::class], function ($userQuery) use ($search): void {
                            $userQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->filled('user_id'), fn ($query) => $query->where('tokenable_id', $request->integer('user_id')))
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        $users = User::query()
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/access/index', [
            'tokens' => AccessTokenResource::collection($tokens),
            'users' => UserResource::collection($users),
            'filters' => $request->only(['search', 'user_id']),
        ]);
    }

    public function store(StoreAccessTokenRequest $request): RedirectResponse
    {
        $user = User::query()->findOrFail($request->integer('user_id'));
        $tokenName = sprintf('token-%s-%s', $user->id, Str::slug($user->name));
        $token = $user->createToken($tokenName);

        return redirect()
            ->route('admin.access.index')
            ->with('success', 'Access token created successfully.')
            ->with('plain_text_token', $token->plainTextToken)
            ->with('created_token_name', $tokenName)
            ->with('created_token_user', $user->name);
    }

    public function destroy(PersonalAccessToken $token): RedirectResponse
    {
        abort_unless($token->tokenable_type === User::class, 404);

        $token->delete();

        return redirect()
            ->route('admin.access.index')
            ->with('success', 'Access token revoked successfully.');
    }
}
