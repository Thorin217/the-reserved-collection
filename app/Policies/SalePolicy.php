<?php

namespace App\Policies;

use App\Enums\SaleStatus;
use App\Models\Sale;
use App\Models\User;

class SalePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function view(User $user, Sale $sale): bool
    {
        return $user->hasRole('admin');
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, Sale $sale): bool
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, Sale $sale): bool
    {
        return false;
    }

    public function confirm(User $user, Sale $sale): bool
    {
        if (! $user->hasRole('admin')) {
            return false;
        }

        return $sale->status === SaleStatus::Draft;
    }

    public function cancel(User $user, Sale $sale): bool
    {
        if (! $user->hasRole('admin')) {
            return false;
        }

        return $sale->status === SaleStatus::Draft;
    }
}
