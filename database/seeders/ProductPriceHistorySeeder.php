<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductPriceHistory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ProductPriceHistorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $startDate = now()->startOfMonth()->subMonths(11);

        Product::query()
            ->with(['variants' => fn ($q) => $q->where('is_active', true)->orderBy('price')])
            ->where('status', 'active')
            ->get()
            ->each(function (Product $product) use ($startDate): void {
                $variant = $product->variants->first();

                if (! $variant?->price) {
                    return;
                }

                $basePrice = (float) $variant->price;
                $trend = fake()->numberBetween(-3, 5) / 100;

                for ($i = 0; $i < 12; $i++) {
                    $date = Carbon::parse($startDate)->addMonths($i)->toDateString();
                    $noise = fake()->numberBetween(-3, 3) / 100;
                    $multiplier = 1 + ($trend * ($i / 11)) + $noise;
                    $price = round(max(1, $basePrice * $multiplier), 2);

                    ProductPriceHistory::query()->updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'recorded_at' => $date,
                        ],
                        [
                            'price' => $price,
                        ],
                    );
                }
            });
    }
}
