<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreLeadProposalItemRequest;
use App\Http\Resources\LeadProposalItemResource;
use App\Models\Lead;
use App\Models\LeadProposal;
use App\Models\LeadProposalItem;
use App\Models\ProductSerial;
use App\Models\ProductVariant;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class LeadProposalItemController extends Controller
{
    public function store(StoreLeadProposalItemRequest $request, Lead $lead, LeadProposal $proposal): JsonResponse
    {
        $validated = $request->validated();

        $this->validateItemRelations($validated);

        $item = $proposal->items()->create($validated);
        $item->load(['product.brand', 'variant', 'serial']);

        $proposal->loadCount('items');

        return ApiResponse::success(
            'Lead proposal item added successfully.',
            LeadProposalItemResource::make($item)->resolve(),
            201
        );
    }

    public function destroy(Lead $lead, LeadProposal $proposal, LeadProposalItem $item): JsonResponse
    {
        $item->delete();

        return ApiResponse::success('Lead proposal item removed successfully.');
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function validateItemRelations(array $validated): void
    {
        $errors = [];

        $variantId = isset($validated['product_variant_id']) ? (int) $validated['product_variant_id'] : null;
        $serialId = isset($validated['product_serial_id']) ? (int) $validated['product_serial_id'] : null;
        $productId = (int) $validated['product_id'];

        if ($variantId !== null) {
            $variant = ProductVariant::query()->find($variantId);

            if (! $variant || $variant->product_id !== $productId) {
                $errors['product_variant_id'] = 'The selected variant does not belong to the selected product.';
            }
        }

        if ($serialId !== null) {
            $serial = ProductSerial::query()->with('productVariant')->find($serialId);

            if (! $serial || $serial->productVariant?->product_id !== $productId) {
                $errors['product_serial_id'] = 'The selected serial does not belong to the selected product.';
            }

            if ($variantId !== null && $serial && $serial->product_variant_id !== $variantId) {
                $errors['product_serial_id'] = 'The selected serial does not belong to the selected variant.';
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }
}
