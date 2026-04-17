<?php

namespace Tests\Feature\Admin;

use App\Models\Attribute;
use App\Models\AttributeOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AttributeConfigurationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:'.base64_encode(random_bytes(32))]);

        $this->actingAs(User::factory()->admin()->create());
    }

    public function test_it_lists_attributes_configuration_page(): void
    {
        Attribute::query()->create([
            'code' => 'material',
            'name' => 'Material',
            'entity_level' => 'product',
            'data_type' => 'select',
            'is_active' => true,
        ]);

        $this->get('/admin/attributes')
            ->assertSuccessful()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inventory/attributes/index')
                ->where('attributes.data.0.code', 'material')
            );
    }

    public function test_it_creates_a_product_attribute_with_options(): void
    {
        $this->post('/admin/attributes', [
            'code' => 'strap_material',
            'name' => 'Strap Material',
            'entity_level' => 'product',
            'data_type' => 'select',
            'is_filterable' => true,
            'is_required' => true,
            'is_active' => true,
            'options' => [
                ['value' => 'leather', 'label' => 'Leather'],
                ['value' => 'rubber', 'label' => 'Rubber'],
            ],
        ])->assertRedirect('/admin/attributes');

        $attribute = Attribute::query()->where('code', 'strap_material')->firstOrFail();

        $this->assertDatabaseHas('attributes', [
            'id' => $attribute->id,
            'name' => 'Strap Material',
            'entity_level' => 'product',
            'data_type' => 'select',
        ]);

        $this->assertDatabaseHas('attribute_options', [
            'attribute_id' => $attribute->id,
            'value' => 'leather',
            'label' => 'Leather',
        ]);
    }

    public function test_it_updates_a_select_attribute_and_synchronizes_options(): void
    {
        $attribute = Attribute::query()->create([
            'code' => 'dial_color',
            'name' => 'Dial Color',
            'entity_level' => 'product',
            'data_type' => 'select',
            'is_active' => true,
        ]);

        $oldOption = AttributeOption::query()->create([
            'attribute_id' => $attribute->id,
            'value' => 'black',
            'label' => 'Black',
            'sort_order' => 1,
        ]);

        $this->put('/admin/attributes/'.$attribute->id, [
            'code' => 'dial_color',
            'name' => 'Dial Colour',
            'entity_level' => 'product',
            'data_type' => 'select',
            'is_filterable' => true,
            'is_required' => false,
            'is_active' => true,
            'options' => [
                ['id' => $oldOption->id, 'value' => 'blue', 'label' => 'Blue'],
                ['value' => 'green', 'label' => 'Green'],
            ],
        ])->assertRedirect('/admin/attributes');

        $this->assertDatabaseHas('attribute_options', [
            'id' => $oldOption->id,
            'attribute_id' => $attribute->id,
            'value' => 'blue',
        ]);

        $this->assertDatabaseHas('attribute_options', [
            'attribute_id' => $attribute->id,
            'value' => 'green',
        ]);
    }

    public function test_it_creates_attribute_from_inline_endpoint(): void
    {
        $this->postJson('/admin/attributes/inline', [
            'code' => 'case_material',
            'name' => 'Case Material',
            'entity_levels' => ['product', 'variant'],
            'data_type' => 'select',
            'is_filterable' => true,
            'is_required' => false,
            'is_active' => true,
            'options' => [
                ['value' => 'steel', 'label' => 'Steel'],
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('data.code', 'case_material')
            ->assertJsonPath('data.entity_levels.0', 'product');

        $attribute = Attribute::query()->where('code', 'case_material')->firstOrFail();

        $this->assertDatabaseHas('attribute_entity_levels', [
            'attribute_id' => $attribute->id,
            'entity_level' => 'variant',
        ]);
    }

    public function test_it_creates_attribute_option_from_inline_endpoint(): void
    {
        $attribute = Attribute::query()->create([
            'code' => 'bezel_material',
            'name' => 'Bezel Material',
            'entity_level' => 'product',
            'data_type' => 'select',
            'is_active' => true,
        ]);

        $this->postJson('/admin/attributes/'.$attribute->id.'/options/inline', [
            'value' => 'ceramic',
            'label' => 'Ceramic',
        ])
            ->assertCreated()
            ->assertJsonPath('data.attribute_id', $attribute->id)
            ->assertJsonPath('data.value', 'ceramic');

        $this->assertDatabaseHas('attribute_options', [
            'attribute_id' => $attribute->id,
            'value' => 'ceramic',
            'label' => 'Ceramic',
        ]);
    }
}
