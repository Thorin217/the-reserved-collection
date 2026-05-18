<?php

use App\Mail\ProposalMailable;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Client;
use App\Models\Lead;
use App\Models\LeadProposal;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    Sanctum::actingAs($this->user);

    $this->client = Client::factory()->create([
        'email' => 'client@example.com',
    ]);

    $this->assignedUser = User::factory()->create();

    $this->brand = Brand::factory()->create();
    $this->category = Category::factory()->create();

    $this->product = Product::factory()->create([
        'brand_id' => $this->brand->id,
        'category_id' => $this->category->id,
    ]);

    $this->variant = ProductVariant::factory()->create([
        'product_id' => $this->product->id,
    ]);
});

it('lists, creates, updates and deletes leads through the api', function () {
    Lead::factory()->create([
        'client_id' => $this->client->id,
        'assigned_to' => $this->assignedUser->id,
        'title' => 'Rolex web inquiry',
        'status' => 'new',
        'source' => 'web',
    ]);

    $this->getJson('/api/v1/leads?search=Rolex&status=new')
        ->assertOk()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Leads retrieved successfully.')
        ->assertJsonPath('data.data.0.title', 'Rolex web inquiry');

    $createResponse = $this->postJson('/api/v1/leads', [
        'client_id' => $this->client->id,
        'assigned_to' => $this->assignedUser->id,
        'title' => 'Lead interesado en Rolex Daytona',
        'status' => 'new',
        'source' => 'web',
        'product_interest' => 'Rolex Daytona Panda',
        'expected_value' => 28500,
        'notes' => 'Cliente solicita seguimiento.',
    ])->assertCreated();

    $createResponse
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Lead created successfully.');

    $leadId = $createResponse->json('data.id');

    $this->patchJson("/api/v1/leads/{$leadId}", [
        'client_id' => $this->client->id,
        'assigned_to' => $this->assignedUser->id,
        'title' => 'Lead interesado en Rolex Daytona',
        'status' => 'contacted',
        'source' => 'web',
        'product_interest' => 'Rolex Daytona Panda',
        'expected_value' => 29000,
        'notes' => 'Cliente ya fue contactado.',
    ])->assertOk()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Lead updated successfully.')
        ->assertJsonPath('data.status', 'contacted');

    $this->getJson("/api/v1/leads/{$leadId}?include=client,assigned_user")
        ->assertOk()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Lead retrieved successfully.')
        ->assertJsonPath('data.client.email', 'client@example.com');

    $this->deleteJson("/api/v1/leads/{$leadId}")
        ->assertOk()
        ->assertJson([
            'status' => true,
            'message' => 'Lead deleted successfully.',
        ]);
});

it('creates and deletes lead interactions through the api', function () {
    $lead = Lead::factory()->create([
        'client_id' => $this->client->id,
        'assigned_to' => $this->assignedUser->id,
    ]);

    $response = $this->postJson("/api/v1/leads/{$lead->id}/interactions", [
        'type' => 'whatsapp',
        'notes' => 'Cliente respondió y pidió propuesta.',
    ])->assertCreated()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Lead interaction created successfully.')
        ->assertJsonPath('data.type', 'whatsapp');

    $interactionId = $response->json('data.id');

    $this->deleteJson("/api/v1/leads/{$lead->id}/interactions/{$interactionId}")
        ->assertOk()
        ->assertJson([
            'status' => true,
            'message' => 'Lead interaction deleted successfully.',
        ]);
});

it('creates, shows, sends and deletes proposals through the api', function () {
    Mail::fake();

    $lead = Lead::factory()->create([
        'client_id' => $this->client->id,
        'assigned_to' => $this->assignedUser->id,
    ]);

    $proposalResponse = $this->postJson("/api/v1/leads/{$lead->id}/proposals", [
        'title' => 'Propuesta Rolex Daytona Panda',
        'notes' => 'Primera propuesta enviada al cliente.',
        'items' => [
            [
                'product_id' => $this->product->id,
                'product_variant_id' => $this->variant->id,
                'product_serial_id' => null,
                'name' => 'Rolex Daytona Panda',
                'model' => '116500LN',
                'suggested_price' => 28500,
                'description' => 'Reloj deportivo en excelente estado.',
                'notes' => 'Incluye caja y papeles.',
            ],
        ],
    ])->assertCreated()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Lead proposal created successfully.')
        ->assertJsonPath('data.title', 'Propuesta Rolex Daytona Panda');

    $proposalId = $proposalResponse->json('data.id');

    $this->getJson("/api/v1/leads/{$lead->id}/proposals/{$proposalId}?include=items.product,items.variant,user")
        ->assertOk()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Lead proposal retrieved successfully.')
        ->assertJsonPath('data.items.0.product.id', $this->product->id)
        ->assertJsonPath('data.items.0.variant.id', $this->variant->id);

    $this->getJson("/api/v1/proposals?lead_id={$lead->id}&status=draft")
        ->assertOk()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Lead proposals retrieved successfully.')
        ->assertJsonPath('data.data.0.id', $proposalId);

    $this->postJson("/api/v1/leads/{$lead->id}/proposals/{$proposalId}/send", [
        'sent_via' => 'email',
    ])->assertOk()
        ->assertJsonPath('status', true)
        ->assertJsonPath('data.status', 'sent')
        ->assertJsonPath('data.sent_via', 'email');

    Mail::assertSent(ProposalMailable::class);

    $this->deleteJson("/api/v1/leads/{$lead->id}/proposals/{$proposalId}")
        ->assertOk()
        ->assertJson([
            'status' => true,
            'message' => 'Lead proposal deleted successfully.',
        ]);
});

it('creates, lists, updates and deletes negotiations and offers through the api', function () {
    $lead = Lead::factory()->create([
        'client_id' => $this->client->id,
        'assigned_to' => $this->assignedUser->id,
        'status' => 'contacted',
    ]);

    $proposal = LeadProposal::factory()->create([
        'lead_id' => $lead->id,
        'user_id' => $this->user->id,
    ]);

    $negotiationResponse = $this->postJson("/api/v1/leads/{$lead->id}/negotiations", [
        'lead_proposal_id' => $proposal->id,
        'initial_price' => 28500,
        'notes' => 'Cliente solicita mejor precio.',
    ])->assertCreated()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Negotiation created successfully.')
        ->assertJsonPath('data.status', 'negotiating');

    $negotiationId = $negotiationResponse->json('data.id');

    $this->getJson("/api/v1/negotiations?lead_id={$lead->id}&status=negotiating")
        ->assertOk()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Negotiations retrieved successfully.')
        ->assertJsonPath('data.data.0.id', $negotiationId);

    $offerResponse = $this->postJson("/api/v1/leads/{$lead->id}/negotiations/{$negotiationId}/offers", [
        'type' => 'client_counteroffer',
        'amount' => 27200,
        'notes' => 'Cliente propone cerrar hoy.',
    ])->assertCreated()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Negotiation offer created successfully.')
        ->assertJsonPath('data.type', 'client_counteroffer');

    $offerId = $offerResponse->json('data.id');

    $this->getJson("/api/v1/leads/{$lead->id}/negotiations/{$negotiationId}?include=proposal,offers,user")
        ->assertOk()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Negotiation retrieved successfully.')
        ->assertJsonPath('data.proposal.id', $proposal->id)
        ->assertJsonPath('data.offers.0.id', $offerId);

    $this->patchJson("/api/v1/leads/{$lead->id}/negotiations/{$negotiationId}", [
        'status' => 'agreed',
        'final_price' => 27800,
        'notes' => 'Cliente aceptó.',
    ])->assertOk()
        ->assertJsonPath('status', true)
        ->assertJsonPath('message', 'Negotiation updated successfully.')
        ->assertJsonPath('data.status', 'agreed');

    expect($lead->fresh()->status->value)->toBe('won');

    $this->deleteJson("/api/v1/leads/{$lead->id}/negotiations/{$negotiationId}/offers/{$offerId}")
        ->assertOk()
        ->assertJson([
            'status' => true,
            'message' => 'Negotiation offer deleted successfully.',
        ]);

    $this->deleteJson("/api/v1/leads/{$lead->id}/negotiations/{$negotiationId}")
        ->assertOk()
        ->assertJson([
            'status' => true,
            'message' => 'Negotiation deleted successfully.',
        ]);
});
