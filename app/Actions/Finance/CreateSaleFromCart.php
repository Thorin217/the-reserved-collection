<?php

namespace App\Actions\Finance;

use App\Enums\SaleStatus;
use App\Models\CartItem;
use App\Models\Client;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CreateSaleFromCart
{
    public function handle(User $user): Sale
    {
        return DB::transaction(function () use ($user): Sale {
            $cartItems = CartItem::query()
                ->with(['variant.product'])
                ->where('user_id', $user->id)
                ->get();

            if ($cartItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => 'Your cart is empty.',
                ]);
            }

            $client = $user->client ?? Client::query()->create([
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => true,
            ]);

            $subtotal = $cartItems->sum(function (CartItem $item): float {
                $price = (float) ($item->variant?->price ?? 0);

                return $price * $item->quantity;
            });

            $sale = Sale::query()->create([
                'client_id' => $client->id,
                'lead_id' => null,
                'quote_id' => null,
                'negotiation_id' => null,
                'warehouse_id' => null,
                'user_id' => $user->id,
                'sale_number' => $this->temporarySaleNumber(),
                'status' => SaleStatus::Draft,
                'currency' => 'USD',
                'sold_at' => null,
                'subtotal' => $subtotal,
                'tax_total' => 0,
                'discount_total' => 0,
                'total' => $subtotal,
                'balance_due' => $subtotal,
                'notes' => 'Portal order created from cart.',
            ]);

            $sale->forceFill([
                'sale_number' => $this->finalSaleNumber($sale),
            ])->save();

            foreach ($cartItems as $item) {
                $productName = $item->variant?->product?->name ?? 'Product';
                $variantSummary = $item->variant?->attribute_summary;

                $description = $variantSummary
                    ? $productName.' - '.$variantSummary
                    : $productName;

                $unitPrice = (float) ($item->variant?->price ?? 0);
                $quantity = (float) $item->quantity;

                $sale->items()->create([
                    'product_variant_id' => $item->product_variant_id,
                    'product_serial_id' => null,
                    'description' => $description,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $unitPrice * $quantity,
                ]);
            }

            CartItem::query()->where('user_id', $user->id)->delete();

            return $sale->fresh([
                'client',
                'items.productVariant.product',
            ]);
        });
    }

    private function temporarySaleNumber(): string
    {
        return 'SALE-TMP-'.Str::upper(Str::random(12));
    }

    private function finalSaleNumber(Sale $sale): string
    {
        return 'SALE-'.str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT);
    }
}
