<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AttributeDataType;
use App\Enums\AttributeEntityLevel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAttributeRequest;
use App\Http\Requests\Admin\UpdateAttributeRequest;
use App\Http\Resources\AttributeResource;
use App\Models\Attribute;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AttributeController extends Controller
{
    public function index(): Response
    {
        $attributes = Attribute::query()
            ->with([
                'attributeOptions' => fn ($query) => $query->orderBy('sort_order')->orderBy('id'),
                'entityLevels',
            ])
            ->withCount('productAttributeValues')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('inventory/attributes/index', [
            'attributes' => AttributeResource::collection($attributes),
            'dataTypes' => array_map(fn (AttributeDataType $type) => $type->value, AttributeDataType::cases()),
            'entityLevels' => array_map(fn (AttributeEntityLevel $level) => $level->value, AttributeEntityLevel::cases()),
        ]);
    }

    public function store(StoreAttributeRequest $request): RedirectResponse
    {
        $payload = $request->validated();

        DB::transaction(function () use ($payload): void {
            $entityLevels = collect($payload['entity_levels'])->map(fn (string $level): string => $level)->unique()->values();

            $attribute = Attribute::query()->create([
                'code' => $payload['code'],
                'name' => $payload['name'],
                'entity_level' => (string) ($entityLevels->first() ?? AttributeEntityLevel::Product->value),
                'data_type' => $payload['data_type'],
                'unit' => $payload['unit'] ?? null,
                'is_filterable' => $payload['is_filterable'] ?? false,
                'is_required' => $payload['is_required'] ?? false,
                'sort_order' => $payload['sort_order'] ?? 0,
                'is_active' => $payload['is_active'] ?? true,
            ]);

            $this->syncEntityLevels($attribute, $entityLevels->all());

            $this->syncOptions($attribute, $payload['options'] ?? []);
        });

        return redirect()->route('admin.attributes.index')->with('success', 'Attribute created successfully.');
    }

    public function update(UpdateAttributeRequest $request, Attribute $attribute): RedirectResponse
    {
        $payload = $request->validated();

        DB::transaction(function () use ($attribute, $payload): void {
            $entityLevels = collect($payload['entity_levels'])->map(fn (string $level): string => $level)->unique()->values();

            $attribute->update([
                'code' => $payload['code'],
                'name' => $payload['name'],
                'entity_level' => (string) ($entityLevels->first() ?? AttributeEntityLevel::Product->value),
                'data_type' => $payload['data_type'],
                'unit' => $payload['unit'] ?? null,
                'is_filterable' => $payload['is_filterable'] ?? false,
                'is_required' => $payload['is_required'] ?? false,
                'sort_order' => $payload['sort_order'] ?? 0,
                'is_active' => $payload['is_active'] ?? true,
            ]);

            $this->syncEntityLevels($attribute, $entityLevels->all());

            $this->syncOptions($attribute, $payload['options'] ?? []);
        });

        return redirect()->route('admin.attributes.index')->with('success', 'Attribute updated successfully.');
    }

    public function destroy(Attribute $attribute): RedirectResponse
    {
        if ($attribute->productAttributeValues()->exists()) {
            return redirect()->route('admin.attributes.index')->with('error', 'This attribute cannot be deleted because it has assigned values.');
        }

        $attribute->delete();

        return redirect()->route('admin.attributes.index')->with('success', 'Attribute deleted successfully.');
    }

    private function syncOptions(Attribute $attribute, array $optionsPayload): void
    {
        $existingOptions = $attribute->attributeOptions()->get()->keyBy('id');
        $keptOptionIds = [];

        foreach ($optionsPayload as $index => $optionPayload) {
            $value = trim((string) ($optionPayload['value'] ?? ''));
            $label = isset($optionPayload['label']) ? trim((string) $optionPayload['label']) : null;

            if ($value === '') {
                continue;
            }

            $optionId = isset($optionPayload['id']) && $optionPayload['id'] !== ''
                ? (int) $optionPayload['id']
                : null;

            if ($optionId && $existingOptions->has($optionId)) {
                $option = $existingOptions->get($optionId);
                $option->update([
                    'value' => $value,
                    'label' => $label !== '' ? $label : null,
                    'sort_order' => $index + 1,
                ]);
                $keptOptionIds[] = $option->id;

                continue;
            }

            $createdOption = $attribute->attributeOptions()->create([
                'value' => $value,
                'label' => $label !== '' ? $label : null,
                'sort_order' => $index + 1,
            ]);

            $keptOptionIds[] = $createdOption->id;
        }

        if (count($keptOptionIds) > 0) {
            $attribute->attributeOptions()->whereNotIn('id', $keptOptionIds)->delete();

            return;
        }

        $attribute->attributeOptions()->delete();
    }

    /**
     * @param  array<int, string>  $entityLevels
     */
    private function syncEntityLevels(Attribute $attribute, array $entityLevels): void
    {
        $rows = collect($entityLevels)
            ->map(fn (string $level): array => ['entity_level' => $level])
            ->all();

        $attribute->entityLevels()->delete();

        if ($rows === []) {
            return;
        }

        $attribute->entityLevels()->createMany($rows);
    }
}
