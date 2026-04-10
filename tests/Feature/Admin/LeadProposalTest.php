<?php

use App\Enums\ProposalStatus;
use App\Http\Middleware\EnsureIsAdmin;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Client;
use App\Models\Lead;
use App\Models\LeadProposal;
use App\Models\LeadProposalItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Auth\Middleware\EnsureEmailIsVerified;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutMiddleware([
        Authenticate::class,
        EnsureEmailIsVerified::class,
        EnsureIsAdmin::class,
        VerifyCsrfToken::class,
        PreventRequestForgery::class,
    ]);
    $this->actingAs(User::factory()->create());

    $this->client = Client::factory()->create();
    $this->lead = Lead::factory()->create(['client_id' => $this->client->id]);
    $this->brand = Brand::factory()->create();
    $this->category = Category::factory()->create();
});

it('renders create proposal page with products', function () {
    Product::factory()->count(2)->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
        'status' => 'active',
    ]);

    $this->get("/admin/leads/{$this->lead->id}/proposals/create")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('crm/leads/proposals/create')
            ->has('lead.data')
            ->has('products.data', 2)
        );
});

it('stores a proposal with items', function () {
    $product = Product::factory()->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
        'status' => 'active',
    ]);
    $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

    $this->post("/admin/leads/{$this->lead->id}/proposals", [
        'title' => 'Luxury Watch Selection',
        'notes' => 'Curated for the client',
        'items' => [
            [
                'product_id' => $product->id,
                'product_variant_id' => $variant->id,
                'product_serial_id' => null,
                'name' => $product->name,
                'model' => 'Gold edition',
                'suggested_price' => '12500.00',
                'description' => 'Excellent condition',
                'notes' => null,
            ],
        ],
    ])->assertRedirect("/admin/leads/{$this->lead->id}");

    expect(LeadProposal::where('lead_id', $this->lead->id)->count())->toBe(1);
    expect(LeadProposalItem::count())->toBe(1);

    $this->assertDatabaseHas('lead_proposals', [
        'lead_id' => $this->lead->id,
        'title' => 'Luxury Watch Selection',
        'status' => ProposalStatus::Draft->value,
    ]);
});

it('requires title and at least one item when storing a proposal', function () {
    $this->post("/admin/leads/{$this->lead->id}/proposals", [
        'title' => '',
        'items' => [],
    ])->assertSessionHasErrors(['title', 'items']);
});

it('shows proposal detail page', function () {
    $proposal = LeadProposal::factory()->create(['lead_id' => $this->lead->id]);
    $product = Product::factory()->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
    ]);
    LeadProposalItem::factory()->create([
        'lead_proposal_id' => $proposal->id,
        'product_id' => $product->id,
        'name' => $product->name,
        'suggested_price' => '5000.00',
    ]);

    $this->get("/admin/leads/{$this->lead->id}/proposals/{$proposal->id}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('crm/leads/proposals/show')
            ->has('lead.data')
            ->has('proposal.data')
            ->has('proposal.data.items', 1)
        );
});

it('marks a draft proposal as sent', function () {
    $proposal = LeadProposal::factory()->create(['lead_id' => $this->lead->id]);

    $this->post("/admin/leads/{$this->lead->id}/proposals/{$proposal->id}/send", [
        'sent_via' => 'whatsapp',
    ])->assertRedirect("/admin/leads/{$this->lead->id}");

    $this->assertDatabaseHas('lead_proposals', [
        'id' => $proposal->id,
        'status' => ProposalStatus::Sent->value,
        'sent_via' => 'whatsapp',
    ]);
});

it('requires sent_via when sending a proposal', function () {
    $proposal = LeadProposal::factory()->create(['lead_id' => $this->lead->id]);

    $this->post("/admin/leads/{$this->lead->id}/proposals/{$proposal->id}/send", [
        'sent_via' => 'fax',
    ])->assertSessionHasErrors(['sent_via']);
});

it('deletes a proposal', function () {
    $proposal = LeadProposal::factory()->create(['lead_id' => $this->lead->id]);

    $this->delete("/admin/leads/{$this->lead->id}/proposals/{$proposal->id}")
        ->assertRedirect("/admin/leads/{$this->lead->id}");

    expect(LeadProposal::find($proposal->id))->toBeNull();
});
