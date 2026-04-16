<?php

namespace App\Policies;

use App\Models\Quote;
use App\Models\User;

class QuotePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function view(User $user, Quote $quote): bool
    {
        return $user->hasRole('admin');
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function update(User $user, Quote $quote): bool
    {
        return $user->hasRole('admin');
    }

    public function delete(User $user, Quote $quote): bool
    {
        if (! $user->hasRole('admin')) {
            return false;
        }

        return ! $quote->sales()->exists();
    }

    public function convertToSale(User $user, Quote $quote): bool
    {
        if (! $user->hasRole('admin')) {
            return false;
        }

        return $quote->items()->exists();
    }

    public function restore(User $user, Quote $quote): bool
    {
        return false;
    }

    public function forceDelete(User $user, Quote $quote): bool
    {
        return false;
    }
}
