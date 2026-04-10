<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        DB::table('model_has_roles')->truncate();
        DB::table('model_has_permissions')->truncate();
        DB::table('role_has_permissions')->truncate();
        DB::table('roles')->truncate();
        DB::table('permissions')->truncate();

        DB::table('inventory_adjustment_items')->truncate();
        DB::table('inventory_adjustments')->truncate();
        DB::table('inventory_transfer_items')->truncate();
        DB::table('inventory_transfers')->truncate();
        DB::table('inventory_reservations')->truncate();
        DB::table('inventory_movements')->truncate();
        DB::table('inventory_stocks')->truncate();
        DB::table('product_serials')->truncate();
        DB::table('product_attribute_values')->truncate();
        DB::table('product_variants')->truncate();
        DB::table('products')->truncate();
        DB::table('attribute_options')->truncate();
        DB::table('attributes')->truncate();
        DB::table('warehouses')->truncate();
        DB::table('branches')->truncate();
        DB::table('categories')->truncate();
        DB::table('brands')->truncate();
        DB::table('users')->truncate();

        Schema::enableForeignKeyConstraints();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $adminRole = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $customerRole = Role::create(['name' => 'customer', 'guard_name' => 'web']);

        $admin = User::query()->create([
            'name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $admin->assignRole($adminRole);

        $customer = User::query()->create([
            'name' => 'Cliente Demo',
            'email' => 'cliente@reserved-collection.pe',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $customer->assignRole($customerRole);

        $this->call([
            PhaseOneInventorySeeder::class,
            PhaseOneInventoryWorkflowSeeder::class,
            PortalSeeder::class,
        ]);
    }
}
