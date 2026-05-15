<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLeadProposalRequest;
use App\Http\Requests\Api\V1\LeadProposalSendRequest;
use App\Http\Resources\LeadProposalResource;
use App\Mail\ProposalMailable;
use App\Models\Lead;
use App\Models\LeadProposal;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;

class LeadProposalController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:draft,sent,viewed,accepted,rejected'],
            'sent_via' => ['nullable', 'in:whatsapp,email'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'lead_id' => ['nullable', 'integer', 'exists:leads,id'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = (int) $request->integer('per_page', 15);

        $proposals = LeadProposal::query()
            ->with(['lead.client', 'user'])
            ->withCount('items')
            ->when($request->filled('search'), fn (Builder $query) => $query->where('title', 'like', '%'.$request->string('search').'%'))
            ->when($request->filled('status'), fn (Builder $query) => $query->where('status', $request->string('status')))
            ->when($request->filled('sent_via'), fn (Builder $query) => $query->where('sent_via', $request->string('sent_via')))
            ->when($request->filled('user_id'), fn (Builder $query) => $query->where('user_id', $request->integer('user_id')))
            ->when($request->filled('lead_id'), fn (Builder $query) => $query->where('lead_id', $request->integer('lead_id')))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::success(
            'Lead proposals retrieved successfully.',
            LeadProposalResource::collection($proposals)->response()->getData(true)
        );
    }

    public function show(Request $request, Lead $lead, LeadProposal $proposal): JsonResponse
    {
        $validated = $request->validate([
            'include' => ['nullable', 'string'],
        ]);

        $includes = $this->parseIncludes($validated['include'] ?? null);

        $relations = ['user'];

        if (in_array('items.product', $includes, true) || in_array('items.variant', $includes, true) || in_array('items.serial', $includes, true)) {
            $relations['items'] = function ($query) use ($includes): void {
                $query->with(array_values(array_filter([
                    in_array('items.product', $includes, true) ? 'product.brand' : null,
                    in_array('items.variant', $includes, true) ? 'variant' : null,
                    in_array('items.serial', $includes, true) ? 'serial' : null,
                ])));
            };
        }

        if (in_array('lead', $includes, true)) {
            $relations[] = 'lead.client';
        }

        $proposal->load($relations);
        $proposal->loadCount('items');

        return ApiResponse::success(
            'Lead proposal retrieved successfully.',
            LeadProposalResource::make($proposal)->resolve()
        );
    }

    public function store(StoreLeadProposalRequest $request, Lead $lead): JsonResponse
    {
        $validated = $request->validated();

        $this->validateProposalItems($validated['items']);

        $proposal = $lead->proposals()->create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'notes' => $validated['notes'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            $proposal->items()->create($item);
        }

        $proposal->load(['user', 'items.product.brand', 'items.variant', 'items.serial']);
        $proposal->loadCount('items');

        return ApiResponse::success(
            'Lead proposal created successfully.',
            LeadProposalResource::make($proposal)->resolve(),
            201
        );
    }

    public function send(LeadProposalSendRequest $request, Lead $lead, LeadProposal $proposal): JsonResponse
    {
        $validated = $request->validated();

        $previewUrl = URL::temporarySignedRoute(
            'portal.proposals.preview',
            now()->addDays(7),
            ['proposal' => $proposal->id],
        );

        if ($validated['sent_via'] === 'email') {
            $lead->loadMissing('client');

            if (! $lead->client?->email) {
                throw ValidationException::withMessages([
                    'sent_via' => 'Client has no email address.',
                ]);
            }

            $proposal->loadMissing('items.product');

            Mail::to($lead->client->email)
                ->send(new ProposalMailable($proposal, $lead, $previewUrl));
        }

        $proposal->update([
            'status' => 'sent',
            'sent_via' => $validated['sent_via'],
            'sent_at' => now(),
        ]);

        $proposal->load(['user', 'items.product.brand', 'items.variant', 'items.serial']);
        $proposal->loadCount('items');

        return ApiResponse::success(
            $validated['sent_via'] === 'email'
                ? 'Proposal sent by email.'
                : 'Proposal marked as sent via WhatsApp.',
            LeadProposalResource::make($proposal)->resolve()
        );
    }

    public function destroy(Lead $lead, LeadProposal $proposal): JsonResponse
    {
        $proposal->delete();

        return ApiResponse::success('Lead proposal deleted successfully.');
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    private function validateProposalItems(array $items): void
    {
        $errors = [];

        foreach ($items as $index => $item) {
            $variantId = isset($item['product_variant_id']) ? (int) $item['product_variant_id'] : null;
            $serialId = isset($item['product_serial_id']) ? (int) $item['product_serial_id'] : null;
            $productId = (int) $item['product_id'];

            if ($variantId !== null) {
                $variant = ProductVariant::query()->find($variantId);

                if (! $variant || $variant->product_id !== $productId) {
                    $errors["items.{$index}.product_variant_id"] = 'The selected variant does not belong to the selected product.';
                }
            }

            if ($serialId !== null) {
                $serial = ProductSerial::query()
                    ->with('productVariant')
                    ->find($serialId);

                if (! $serial || $serial->productVariant?->product_id !== $productId) {
                    $errors["items.{$index}.product_serial_id"] = 'The selected serial does not belong to the selected product.';
                }

                if ($variantId !== null && $serial && $serial->product_variant_id !== $variantId) {
                    $errors["items.{$index}.product_serial_id"] = 'The selected serial does not belong to the selected variant.';
                }
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    /**
     * @return array<int, string>
     */
    private function parseIncludes(?string $include): array
    {
        if ($include === null || trim($include) === '') {
            return [];
        }

        return collect(explode(',', $include))
            ->map(fn (string $value): string => trim($value))
            ->filter(fn (string $value): bool => in_array($value, ['lead', 'items.product', 'items.variant', 'items.serial', 'user'], true))
            ->unique()
            ->values()
            ->all();
    }
}
