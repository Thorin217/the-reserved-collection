<?php

namespace Database\Seeders;

use App\Enums\InventoryMovementType;
use App\Enums\ProductStatus;
use App\Enums\ProductType;
use App\Models\Brand;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class PortalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ── Categories ──────────────────────────────────────────────────────────
        $timepieces = Category::firstOrCreate(
            ['slug' => 'timepieces'],
            ['name' => 'Timepieces', 'is_active' => true, 'description' => 'Luxury watches and timepieces']
        );

        $jewelry = Category::firstOrCreate(
            ['slug' => 'jewelry'],
            ['name' => 'Jewelry', 'is_active' => true, 'description' => 'Fine jewelry including rings, necklaces, bracelets, and earrings']
        );

        $vault = Category::firstOrCreate(
            ['slug' => 'the-vault'],
            ['name' => 'The Vault', 'is_active' => true, 'description' => 'Rare collectibles, luxury handbags, art, and memorabilia']
        );

        // ── Brands ───────────────────────────────────────────────────────────────
        $brandNames = [
            'Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'Cartier',
            'Breitling', 'IWC', 'Tudor', 'Bulgari', 'Tiffany & Co.',
            'Hermès', 'Chanel', 'Louis Vuitton', 'Van Cleef & Arpels', 'Chopard',
        ];

        $brandMap = collect($brandNames)->mapWithKeys(fn ($name) => [
            $name => Brand::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'is_active' => true]
            ),
        ]);

        // ── Timepieces ───────────────────────────────────────────────────────────
        $watchProducts = [
            ['name' => 'Submariner Date 116610LN', 'brand' => 'Rolex', 'sku' => 'ROL-SUB-116610', 'price' => 15800, 'compare' => 18500, 'img' => 'watch'],
            ['name' => 'Datejust 41 126334', 'brand' => 'Rolex', 'sku' => 'ROL-DJ-126334', 'price' => 9200, 'compare' => null, 'img' => 'watch2'],
            ['name' => 'GMT-Master II Pepsi 126710BLRO', 'brand' => 'Rolex', 'sku' => 'ROL-GMT-126710', 'price' => 19500, 'compare' => 22000, 'img' => 'watch3'],
            ['name' => 'Day-Date 40 Presidential 228238', 'brand' => 'Rolex', 'sku' => 'ROL-DD-228238', 'price' => 38500, 'compare' => null, 'img' => 'watch4'],
            ['name' => 'Explorer II 226570 White', 'brand' => 'Rolex', 'sku' => 'ROL-EXP-226570', 'price' => 10800, 'compare' => 12500, 'img' => 'watch'],
            ['name' => 'Sky-Dweller 336934 Oystersteel', 'brand' => 'Rolex', 'sku' => 'ROL-SKY-336934', 'price' => 16800, 'compare' => 19500, 'img' => 'watch2'],
            ['name' => 'Cosmograph Daytona 116500LN', 'brand' => 'Rolex', 'sku' => 'ROL-DAYT-116500LN', 'price' => 32000, 'compare' => null, 'img' => 'watch3'],
            ['name' => 'Yacht-Master 42 226621', 'brand' => 'Rolex', 'sku' => 'ROL-YM-226621', 'price' => 15200, 'compare' => 17800, 'img' => 'watch4'],
            ['name' => 'Milgauss Z-Blue 116400GV', 'brand' => 'Rolex', 'sku' => 'ROL-MILG-116400GV', 'price' => 10200, 'compare' => null, 'img' => 'watch'],

            ['name' => 'Nautilus 5711/1A-010', 'brand' => 'Patek Philippe', 'sku' => 'PP-NAUT-5711', 'price' => 95000, 'compare' => 110000, 'img' => 'watch2'],
            ['name' => 'Aquanaut 5167A-001', 'brand' => 'Patek Philippe', 'sku' => 'PP-AQUA-5167', 'price' => 62000, 'compare' => null, 'img' => 'watch3'],
            ['name' => 'Calatrava 5196P-001 Platinum', 'brand' => 'Patek Philippe', 'sku' => 'PP-CAL-5196P', 'price' => 48000, 'compare' => 52000, 'img' => 'watch4'],
            ['name' => 'Complications Annual Calendar 5396R', 'brand' => 'Patek Philippe', 'sku' => 'PP-COMP-5396R', 'price' => 55000, 'compare' => null, 'img' => 'watch'],
            ['name' => 'Calatrava Weekly Calendar 5212A', 'brand' => 'Patek Philippe', 'sku' => 'PP-CAL-5212A', 'price' => 72000, 'compare' => 80000, 'img' => 'watch2'],

            ['name' => 'Royal Oak 15510ST Blue Dial', 'brand' => 'Audemars Piguet', 'sku' => 'AP-RO-15510ST', 'price' => 42000, 'compare' => 48000, 'img' => 'watch3'],
            ['name' => 'Royal Oak Offshore 26420SO', 'brand' => 'Audemars Piguet', 'sku' => 'AP-ROO-26420SO', 'price' => 58000, 'compare' => null, 'img' => 'watch4'],
            ['name' => 'Royal Oak Concept Flying Tourbillon', 'brand' => 'Audemars Piguet', 'sku' => 'AP-CONCEPT-FT', 'price' => 185000, 'compare' => 210000, 'img' => 'watch'],
            ['name' => 'Royal Oak Selfwinding 15500ST Green', 'brand' => 'Audemars Piguet', 'sku' => 'AP-RO-15500ST-GRN', 'price' => 45000, 'compare' => null, 'img' => 'watch2'],

            ['name' => 'Speedmaster Professional Moonwatch 310.30.42', 'brand' => 'Omega', 'sku' => 'OM-SPEED-310', 'price' => 6200, 'compare' => 7500, 'img' => 'watch3'],
            ['name' => 'Seamaster Diver 300M 210.32.42.20', 'brand' => 'Omega', 'sku' => 'OM-SEAM-210', 'price' => 5500, 'compare' => null, 'img' => 'watch4'],
            ['name' => 'Constellation Co-Axial 131.10.39.20', 'brand' => 'Omega', 'sku' => 'OM-CONST-131', 'price' => 4800, 'compare' => 5600, 'img' => 'watch'],
            ['name' => 'De Ville Prestige 424.10.37.20', 'brand' => 'Omega', 'sku' => 'OM-DEVILLE-424', 'price' => 3900, 'compare' => null, 'img' => 'watch2'],
            ['name' => 'Speedmaster Apollo 11 50th Anniversary', 'brand' => 'Omega', 'sku' => 'OM-SPEED-AP11-50TH', 'price' => 12000, 'compare' => 15000, 'img' => 'watch3'],

            ['name' => 'Santos de Cartier Large WSSA0018', 'brand' => 'Cartier', 'sku' => 'CAR-SANTOS-WSSA0018', 'price' => 8200, 'compare' => 9500, 'img' => 'watch4'],
            ['name' => 'Tank Française WSTA0067', 'brand' => 'Cartier', 'sku' => 'CAR-TANK-WSTA0067', 'price' => 5800, 'compare' => null, 'img' => 'watch'],
            ['name' => 'Ballon Bleu de Cartier 42mm WSBB0062', 'brand' => 'Cartier', 'sku' => 'CAR-BB-WSBB0062', 'price' => 7400, 'compare' => 8200, 'img' => 'watch2'],
            ['name' => 'Rotonde de Cartier Tourbillon W1556214', 'brand' => 'Cartier', 'sku' => 'CAR-ROT-W1556214', 'price' => 52000, 'compare' => null, 'img' => 'watch3'],

            ['name' => 'Navitimer B01 Chronograph 46 AB0127211', 'brand' => 'Breitling', 'sku' => 'BRE-NAVI-AB0127', 'price' => 8900, 'compare' => 10200, 'img' => 'watch4'],
            ['name' => 'Superocean Heritage B20 Automatic 44', 'brand' => 'Breitling', 'sku' => 'BRE-SOH-AB2030', 'price' => 4200, 'compare' => null, 'img' => 'watch'],
            ['name' => 'Avenger Automatic 45 A17318101G', 'brand' => 'Breitling', 'sku' => 'BRE-AVENG-A17318', 'price' => 3800, 'compare' => 4400, 'img' => 'watch2'],

            ['name' => 'Portofino Automatic IW356505', 'brand' => 'IWC', 'sku' => 'IWC-PORT-IW356505', 'price' => 7800, 'compare' => null, 'img' => 'watch3'],
            ['name' => "Pilot's Watch Mark XX IW328202", 'brand' => 'IWC', 'sku' => 'IWC-PILOT-IW328202', 'price' => 5200, 'compare' => 6100, 'img' => 'watch4'],
            ['name' => "Big Pilot's Watch 43 IW329301", 'brand' => 'IWC', 'sku' => 'IWC-BIGPILOT-IW329301', 'price' => 10500, 'compare' => null, 'img' => 'watch'],

            ['name' => 'Black Bay 58 Navy Blue M79030B', 'brand' => 'Tudor', 'sku' => 'TUD-BB58-M79030B', 'price' => 3500, 'compare' => 4200, 'img' => 'watch2'],
            ['name' => 'Pelagos M25600TB', 'brand' => 'Tudor', 'sku' => 'TUD-PELAG-M25600', 'price' => 3800, 'compare' => null, 'img' => 'watch3'],
            ['name' => 'Heritage Chrono Blue M70330B', 'brand' => 'Tudor', 'sku' => 'TUD-HERI-M70330B', 'price' => 4100, 'compare' => 4800, 'img' => 'watch4'],
            ['name' => 'Black Bay Harrods Edition M79230G', 'brand' => 'Tudor', 'sku' => 'TUD-BB-HARRODS-M79230G', 'price' => 4500, 'compare' => null, 'img' => 'watch'],

            ['name' => 'Octo Finissimo Ultra 103427', 'brand' => 'Bulgari', 'sku' => 'BUL-OCTO-103427', 'price' => 32000, 'compare' => null, 'img' => 'watch2'],
            ['name' => 'Serpenti Tubogas 103266', 'brand' => 'Bulgari', 'sku' => 'BUL-SERP-TUBO-103266', 'price' => 18500, 'compare' => 21000, 'img' => 'watch3'],

            ['name' => 'Happy Sport Quartz 278608-3002', 'brand' => 'Chopard', 'sku' => 'CHOP-HS-278608', 'price' => 6800, 'compare' => null, 'img' => 'watch4'],
            ['name' => 'L.U.C XP 161946-5001', 'brand' => 'Chopard', 'sku' => 'CHOP-LUC-161946', 'price' => 12500, 'compare' => 14000, 'img' => 'watch'],
        ];

        // ── Jewelry ──────────────────────────────────────────────────────────────
        $jewelryProducts = [
            // Rings
            ['name' => 'Solitaire Diamond Engagement Ring 1.5ct', 'brand' => 'Cartier', 'sku' => 'CAR-RING-SOL-1.5', 'price' => 12500, 'compare' => 15000, 'img' => 'ring'],
            ['name' => 'Alhambra 4-Motif Ring Yellow Gold', 'brand' => 'Van Cleef & Arpels', 'sku' => 'VCA-RING-ALH-4', 'price' => 8200, 'compare' => null, 'img' => 'ring'],
            ['name' => 'Love Ring Paved Diamonds B4222900', 'brand' => 'Cartier', 'sku' => 'CAR-LOVE-RING-B4222', 'price' => 5400, 'compare' => 6200, 'img' => 'ring'],
            ['name' => 'Vintage Diamond Cocktail Ring 2ct', 'brand' => 'Van Cleef & Arpels', 'sku' => 'VCA-RING-COCK-2CT', 'price' => 18500, 'compare' => null, 'img' => 'ring'],
            ['name' => 'B.zero1 Ring White Gold AN855782', 'brand' => 'Bulgari', 'sku' => 'BUL-BZERO-AN855782', 'price' => 3200, 'compare' => 3800, 'img' => 'ring'],
            ['name' => 'Tiffany Setting 1ct Engagement Ring', 'brand' => 'Tiffany & Co.', 'sku' => 'TIF-SETT-1CT', 'price' => 9800, 'compare' => null, 'img' => 'ring'],
            ['name' => 'Tiffany T Square Ring 60982348', 'brand' => 'Tiffany & Co.', 'sku' => 'TIF-T-SQUARE-60982', 'price' => 4200, 'compare' => 5000, 'img' => 'ring'],
            ['name' => 'Camélia Diamond Ring 18K White Gold', 'brand' => 'Chanel', 'sku' => 'CHA-CAM-RING-DIA', 'price' => 7500, 'compare' => null, 'img' => 'ring'],
            ['name' => 'Happy Diamonds Ring 826225-1110', 'brand' => 'Chopard', 'sku' => 'CHOP-HD-RING-826225', 'price' => 5800, 'compare' => 6500, 'img' => 'ring'],

            // Necklaces
            ['name' => 'Alhambra Vintage Necklace 20 Motifs', 'brand' => 'Van Cleef & Arpels', 'sku' => 'VCA-ALH-NECK-20M', 'price' => 28000, 'compare' => 32000, 'img' => 'necklace'],
            ['name' => 'Love Necklace Yellow Gold B7212300', 'brand' => 'Cartier', 'sku' => 'CAR-LOVE-NECK-B7212', 'price' => 2900, 'compare' => null, 'img' => 'necklace'],
            ['name' => 'Serpenti Diamond Necklace 352767', 'brand' => 'Bulgari', 'sku' => 'BUL-SERP-NECK-352767', 'price' => 22500, 'compare' => 26000, 'img' => 'necklace'],
            ['name' => 'Diamond Solitaire Pendant 1.2ct', 'brand' => 'Tiffany & Co.', 'sku' => 'TIF-DIA-SOLI-1.2', 'price' => 8500, 'compare' => null, 'img' => 'necklace'],
            ['name' => 'N°5 Diamond Necklace 18K Gold', 'brand' => 'Chanel', 'sku' => 'CHA-N5-DIA-NECK', 'price' => 15000, 'compare' => 18000, 'img' => 'necklace'],
            ['name' => 'COCO Crush Necklace Quilted J10992', 'brand' => 'Chanel', 'sku' => 'CHA-COCO-NECK-J10992', 'price' => 4800, 'compare' => null, 'img' => 'necklace'],
            ['name' => 'Happy Diamonds Pendant 797482-5001', 'brand' => 'Chopard', 'sku' => 'CHOP-HD-PEND-797482', 'price' => 3600, 'compare' => 4200, 'img' => 'necklace'],
            ['name' => 'Return to Tiffany Oval Tag Necklace', 'brand' => 'Tiffany & Co.', 'sku' => 'TIF-RTT-OVAL-NECK', 'price' => 1850, 'compare' => null, 'img' => 'necklace'],
            ['name' => 'Panthère Diamond Necklace Platinum', 'brand' => 'Cartier', 'sku' => 'CAR-PANTH-NECK-DIA', 'price' => 32000, 'compare' => 38000, 'img' => 'necklace'],

            // Bracelets
            ['name' => 'Love Bracelet 18K Yellow Gold B6035517', 'brand' => 'Cartier', 'sku' => 'CAR-LOVE-BRAC-B6035', 'price' => 7200, 'compare' => 8500, 'img' => 'bracelet'],
            ['name' => 'Juste un Clou Bracelet B6048517', 'brand' => 'Cartier', 'sku' => 'CAR-JUC-BRAC-B6048', 'price' => 6800, 'compare' => null, 'img' => 'bracelet'],
            ['name' => 'Alhambra Bracelet 5 Motifs VCBF98V8', 'brand' => 'Van Cleef & Arpels', 'sku' => 'VCA-ALH-BRAC-5M', 'price' => 9500, 'compare' => 11000, 'img' => 'bracelet'],
            ['name' => 'B.zero1 Bracelet White Gold AN856523', 'brand' => 'Bulgari', 'sku' => 'BUL-BZERO-BRAC', 'price' => 4800, 'compare' => null, 'img' => 'bracelet'],
            ['name' => 'HardWear Graduated Link Bracelet', 'brand' => 'Tiffany & Co.', 'sku' => 'TIF-HW-GRAD-BRAC', 'price' => 3500, 'compare' => 4100, 'img' => 'bracelet'],
            ['name' => 'Coco Crush Bracelet J4294', 'brand' => 'Chanel', 'sku' => 'CHA-COCO-BRAC-J4294', 'price' => 5200, 'compare' => null, 'img' => 'bracelet'],
            ['name' => 'H Bracelet Enamel Orange', 'brand' => 'Hermès', 'sku' => 'HER-H-BRAC-ORA', 'price' => 1200, 'compare' => 1500, 'img' => 'bracelet'],
            ['name' => 'Collier de Chien Bracelet Black', 'brand' => 'Hermès', 'sku' => 'HER-CDC-BRAC-BLK', 'price' => 2400, 'compare' => null, 'img' => 'bracelet'],
            ['name' => 'Ice Cube Diamond Bracelet 856812-9001', 'brand' => 'Chopard', 'sku' => 'CHOP-ICE-BRAC', 'price' => 8900, 'compare' => 10500, 'img' => 'bracelet'],
        ];

        // ── The Vault ────────────────────────────────────────────────────────────
        $vaultProducts = [
            ['name' => 'Birkin 30 Togo Leather Gold Hardware', 'brand' => 'Hermès', 'sku' => 'HER-BIRK-30-GOLD', 'price' => 28000, 'compare' => 35000, 'img' => 'bracelet'],
            ['name' => 'Birkin 35 Black Togo Palladium Hardware', 'brand' => 'Hermès', 'sku' => 'HER-BIRK-35-BLK', 'price' => 32000, 'compare' => null, 'img' => 'bracelet'],
            ['name' => 'Kelly 28 Sellier Epsom Craie Gold Hardware', 'brand' => 'Hermès', 'sku' => 'HER-KELLY-28-CRA', 'price' => 24000, 'compare' => 28000, 'img' => 'bracelet'],
            ['name' => 'Constance 24 Rose Gold Evercalf', 'brand' => 'Hermès', 'sku' => 'HER-CONST-24-RSG', 'price' => 18500, 'compare' => null, 'img' => 'bracelet'],
            ['name' => 'Classic Double Flap Black Caviar Medium', 'brand' => 'Chanel', 'sku' => 'CHA-FLAP-BLK-CAV-M', 'price' => 12800, 'compare' => 15000, 'img' => 'bracelet'],
            ['name' => 'Classic Double Flap Beige Lambskin Large', 'brand' => 'Chanel', 'sku' => 'CHA-FLAP-BEI-LAM-L', 'price' => 11500, 'compare' => null, 'img' => 'bracelet'],
            ['name' => 'Boy Chanel Black Chevron Medium Silver', 'brand' => 'Chanel', 'sku' => 'CHA-BOY-BLK-CHE-M', 'price' => 9200, 'compare' => 11000, 'img' => 'bracelet'],
            ['name' => 'Neverfull MM Monogram Canvas', 'brand' => 'Louis Vuitton', 'sku' => 'LV-NF-MM-MONO', 'price' => 1950, 'compare' => null, 'img' => 'bracelet'],
            ['name' => 'Capucines MM Taurillon Leather Black', 'brand' => 'Louis Vuitton', 'sku' => 'LV-CAP-MM-BLK', 'price' => 5800, 'compare' => 6800, 'img' => 'bracelet'],
            ['name' => 'Alma PM Epi Leather Noir', 'brand' => 'Louis Vuitton', 'sku' => 'LV-ALMA-PM-NOIR', 'price' => 2200, 'compare' => null, 'img' => 'bracelet'],
            ['name' => 'Vintage Daytona Paul Newman 6263', 'brand' => 'Rolex', 'sku' => 'ROL-VINT-6263-PN', 'price' => 180000, 'compare' => 220000, 'img' => 'watch'],
            ['name' => 'Vintage Ref. 1518 Stainless Steel', 'brand' => 'Patek Philippe', 'sku' => 'PP-VINT-1518-STEEL', 'price' => 350000, 'compare' => null, 'img' => 'watch2'],
            ['name' => 'Royal Oak 5402 Jumbo First Series 1972', 'brand' => 'Audemars Piguet', 'sku' => 'AP-VINT-5402-JUMBO', 'price' => 75000, 'compare' => 90000, 'img' => 'watch3'],
            ['name' => 'Silk Scarf Brides de Gala 90cm', 'brand' => 'Hermès', 'sku' => 'HER-SCARF-BRDG', 'price' => 650, 'compare' => null, 'img' => 'bracelet'],
            ['name' => 'Enamel Bangle Set of 3', 'brand' => 'Hermès', 'sku' => 'HER-BANGLE-SET-3', 'price' => 980, 'compare' => 1200, 'img' => 'bracelet'],
            ['name' => 'No. 5 Parfum 1.7oz Vintage Sealed', 'brand' => 'Chanel', 'sku' => 'CHA-N5-VINT-1.7', 'price' => 420, 'compare' => null, 'img' => 'necklace'],
            ['name' => 'Tiffany Crystal Vase Atlas Collection', 'brand' => 'Tiffany & Co.', 'sku' => 'TIF-VASE-ATL', 'price' => 1200, 'compare' => 1500, 'img' => 'ring'],
            ['name' => 'Silver Picture Frame 4x6 Peretti', 'brand' => 'Tiffany & Co.', 'sku' => 'TIF-FRAME-4X6', 'price' => 850, 'compare' => null, 'img' => 'ring'],
            ['name' => 'Panthère Table Lighter Gold Plated', 'brand' => 'Cartier', 'sku' => 'CAR-PANTH-LIGHT-GP', 'price' => 2800, 'compare' => 3400, 'img' => 'watch4'],
            ['name' => 'Vintage Alhambra Coin Purse', 'brand' => 'Van Cleef & Arpels', 'sku' => 'VCA-ALH-PURSE-VINT', 'price' => 4500, 'compare' => null, 'img' => 'ring'],
            ['name' => 'Navitimer Vintage Reference 806 1959', 'brand' => 'Breitling', 'sku' => 'BRE-VINT-806-1959', 'price' => 22000, 'compare' => 26000, 'img' => 'watch'],
            ['name' => 'Ingenieur SL Reference 1832 Vintage', 'brand' => 'IWC', 'sku' => 'IWC-VINT-1832', 'price' => 14500, 'compare' => null, 'img' => 'watch2'],
            ['name' => 'Happy Sport 18K Rose Gold Diamond Set', 'brand' => 'Chopard', 'sku' => 'CHOP-HS-18KRG-DSET', 'price' => 9800, 'compare' => 11500, 'img' => 'ring'],
            ['name' => 'Cartier Red Box Collection Case Vintage', 'brand' => 'Cartier', 'sku' => 'CAR-RBOX-VINT', 'price' => 3500, 'compare' => null, 'img' => 'watch4'],
            ['name' => 'Petite Malle Monogram Canvas Mini', 'brand' => 'Louis Vuitton', 'sku' => 'LV-PM-MONO-MINI', 'price' => 4800, 'compare' => 5500, 'img' => 'bracelet'],
        ];

        $warehouse = Warehouse::query()->where('name', 'Almacén Principal San Isidro')->first();

        $this->seedProducts($watchProducts, $timepieces, $brandMap, $warehouse);
        $this->seedProducts($jewelryProducts, $jewelry, $brandMap, $warehouse);
        $this->seedProducts($vaultProducts, $vault, $brandMap, $warehouse);
    }

    /**
     * @param  array<int, array<string, mixed>>  $products
     * @param  Collection<string, Brand>  $brandMap
     */
    private function seedProducts(array $products, Category $category, $brandMap, ?Warehouse $warehouse): void
    {
        $imageMap = [
            'watch' => public_path('images/product-watch1.jpg'),
            'watch2' => public_path('images/product-watch2.jpg'),
            'watch3' => public_path('images/product-watch3.jpg'),
            'watch4' => public_path('images/product-watch4.jpg'),
            'ring' => public_path('images/product-ring.jpg'),
            'necklace' => public_path('images/product-necklace.jpg'),
            'bracelet' => public_path('images/product-bracelet.jpg'),
        ];

        foreach ($products as $data) {
            $brand = $brandMap->get($data['brand']);

            if (! $brand) {
                continue;
            }

            $existing = Product::where('sku', $data['sku'])->first();

            if ($existing) {
                continue;
            }

            $slug = Str::slug($data['name']);
            $uniqueSlug = $slug;
            $counter = 1;
            while (Product::where('slug', $uniqueSlug)->exists()) {
                $uniqueSlug = "{$slug}-{$counter}";
                $counter++;
            }

            $product = Product::create([
                'name' => $data['name'],
                'sku' => $data['sku'],
                'slug' => $uniqueSlug,
                'category_id' => $category->id,
                'brand_id' => $brand->id,
                'product_type' => ProductType::Simple,
                'status' => ProductStatus::Active,
                'has_serial_numbers' => false,
                'track_stock' => true,
                'description' => "Authenticated {$data['name']} from {$data['brand']}. Every piece verified by our specialist team.",
            ]);

            $variant = ProductVariant::create([
                'product_id' => $product->id,
                'sku' => $data['sku'].'-V1',
                'cost' => (int) round($data['price'] * 0.65),
                'price' => $data['price'],
                'compare_price' => $data['compare'],
                'is_active' => true,
                'attribute_summary' => null,
            ]);

            $imagePath = $imageMap[$data['img']] ?? $imageMap['watch'];

            if (file_exists($imagePath)) {
                $product->addMedia($imagePath)
                    ->preservingOriginal()
                    ->toMediaCollection('product');
            }

            if ($warehouse) {
                $quantity = match (true) {
                    $data['price'] >= 50000 => 1,
                    $data['price'] >= 10000 => 2,
                    $data['price'] >= 5000 => 3,
                    default => 5,
                };

                InventoryStock::create([
                    'warehouse_id' => $warehouse->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $quantity,
                    'reserved_quantity' => 0,
                    'available_quantity' => $quantity,
                    'average_cost' => $variant->cost,
                ]);

                InventoryMovement::create([
                    'movement_type' => InventoryMovementType::Opening,
                    'reference_type' => Product::class,
                    'reference_id' => $product->id,
                    'warehouse_id' => $warehouse->id,
                    'branch_id' => $warehouse->branch_id,
                    'product_variant_id' => $variant->id,
                    'serial_id' => null,
                    'quantity' => $quantity,
                    'unit_cost' => $variant->cost,
                    'balance_after_movement' => $quantity,
                    'notes' => "Apertura de stock · {$data['name']}",
                    'user_id' => null,
                ]);
            }
        }
    }
}
