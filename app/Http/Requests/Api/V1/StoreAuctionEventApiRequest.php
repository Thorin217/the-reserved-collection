<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAuctionEventApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'format' => ['required', 'in:lot,grouped_items'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'notes' => ['nullable', 'string'],
            'auctions' => ['required', 'array', 'min:1'],
            'auctions.*.title' => ['required', 'string', 'max:255'],
            'auctions.*.description' => ['nullable', 'string'],
            'auctions.*.items' => ['required', 'array', 'min:1'],
            'auctions.*.items.*.product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'auctions.*.items.*.product_serial_id' => ['nullable', 'integer', 'exists:product_serials,id'],
            'auctions.*.items.*.notes' => ['nullable', 'string'],
            'auctions.*.starting_price' => ['required', 'numeric', 'min:0'],
            'auctions.*.reserve_price' => ['nullable', 'numeric'],
            'auctions.*.minimum_increment' => ['required', 'numeric', 'gt:0'],
            'auctions.*.notes' => ['nullable', 'string'],
        ];
    }
}
