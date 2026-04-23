<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->admin()->create();
});

it('renders the finance module index pages for admins', function () {
    $pages = [
        '/admin/finance/quotes' => 'finance/quotes/index',
        '/admin/finance/sales' => 'finance/sales/index',
        '/admin/finance/receivables' => 'finance/receivables/index',
        '/admin/finance/payables' => 'finance/payables/index',
        '/admin/finance/purchases' => 'finance/purchases/index',
    ];

    foreach ($pages as $url => $component) {
        $this->actingAs($this->user)
            ->get($url)
            ->assertSuccessful()
            ->assertInertia(fn (Assert $page) => $page
                ->component($component)
            );
    }
});
