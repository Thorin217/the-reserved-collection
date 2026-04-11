<?php

namespace Database\Seeders;

use App\Enums\LeadSource;
use App\Enums\LeadStatus;
use App\Enums\NegotiationOfferType;
use App\Enums\NegotiationStatus;
use App\Enums\ProposalStatus;
use App\Models\Client;
use App\Models\Lead;
use App\Models\LeadInteraction;
use App\Models\LeadProposal;
use App\Models\LeadProposalItem;
use App\Models\Negotiation;
use App\Models\NegotiationOffer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class CrmSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@admin.com')->first();
        $portalClient = User::where('email', 'client@client.com')->first();
        $products = Product::with('variants')->get();

        // --- Clients ---

        // Link the portal user to their CRM client record
        $clientRecord = Client::where('email', 'client@client.com')->first();
        $clientRecord->update(['user_id' => $portalClient->id]);

        // Create 2 more portal users linked to CRM clients
        $userSofía = User::create([
            'name' => 'Sofía Morales',
            'email' => 'sofia@example.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);
        $clientSofía = Client::create([
            'user_id' => $userSofía->id,
            'name' => 'Sofía Morales',
            'email' => 'sofia@example.com',
            'phone' => '+51 987 654 321',
            'document_type' => 'rut',
            'document_number' => '12345678-9',
            'address' => 'Av. Javier Prado Este 3600, San Isidro',
            'notes' => 'Cliente VIP. Prefiere relojes Patek Philippe y Audemars Piguet.',
            'is_active' => true,
        ]);

        $userRicardo = User::create([
            'name' => 'Ricardo Fuentes',
            'email' => 'ricardo@example.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);
        $clientRicardo = Client::create([
            'user_id' => $userRicardo->id,
            'name' => 'Ricardo Fuentes',
            'email' => 'ricardo@example.com',
            'phone' => '+51 999 111 222',
            'document_type' => 'passport',
            'document_number' => 'A1234567',
            'address' => 'Calle Las Begonias 441, San Isidro',
            'notes' => 'Coleccionista. Interesado en piezas Rolex edición limitada.',
            'is_active' => true,
        ]);

        // Pure CRM clients (no portal user account)
        $clientMarta = Client::create([
            'user_id' => null,
            'name' => 'Marta Villarreal',
            'email' => 'marta.villarreal@gmail.com',
            'phone' => '+51 944 333 888',
            'document_type' => 'other',
            'document_number' => 'CE-90123',
            'address' => 'Calle Choquehuanca 1057, Miraflores',
            'notes' => 'Referida por Sofía Morales. Primera compra.',
            'is_active' => true,
        ]);

        $clientEmilio = Client::create([
            'user_id' => null,
            'name' => 'Emilio Castañeda',
            'email' => null,
            'phone' => '+51 955 777 444',
            'document_type' => null,
            'document_number' => null,
            'address' => null,
            'notes' => 'Walk-in. Contactado por WhatsApp. Busca joyas para regalo.',
            'is_active' => true,
        ]);

        // --- Leads ---

        // Lead: Won — Sofía compró un reloj
        $leadWon = Lead::create([
            'client_id' => $clientSofía->id,
            'assigned_to' => $admin->id,
            'title' => 'Patek Philippe Nautilus 5711',
            'status' => LeadStatus::Won,
            'source' => LeadSource::Web,
            'product_interest' => 'Patek Philippe Nautilus',
            'expected_value' => 92000.00,
            'notes' => 'Cliente confirmó compra. Pago en efectivo.',
            'closed_at' => now()->subDays(5),
        ]);

        LeadInteraction::create([
            'lead_id' => $leadWon->id,
            'user_id' => $admin->id,
            'type' => 'whatsapp',
            'notes' => 'Cliente consultó disponibilidad del Nautilus 5711. Enviamos fotos y certificado.',
            'interacted_at' => now()->subDays(12),
        ]);
        LeadInteraction::create([
            'lead_id' => $leadWon->id,
            'user_id' => $admin->id,
            'type' => 'visit',
            'notes' => 'Visita a tienda San Isidro. Vio el reloj en persona. Muy interesada.',
            'interacted_at' => now()->subDays(8),
        ]);
        LeadInteraction::create([
            'lead_id' => $leadWon->id,
            'user_id' => $admin->id,
            'type' => 'call',
            'notes' => 'Llamada de cierre. Confirmó compra y acordó retiro en tienda.',
            'interacted_at' => now()->subDays(5),
        ]);

        $proposalWon = LeadProposal::create([
            'lead_id' => $leadWon->id,
            'user_id' => $admin->id,
            'title' => 'Propuesta Nautilus 5711/1A-010',
            'notes' => 'Precio final acordado luego de negociación.',
            'status' => ProposalStatus::Accepted,
            'sent_via' => 'whatsapp',
            'sent_at' => now()->subDays(9),
        ]);

        if ($products->isNotEmpty()) {
            $product = $products->first();
            LeadProposalItem::create([
                'lead_proposal_id' => $proposalWon->id,
                'product_id' => $product->id,
                'product_variant_id' => $product->variants->first()?->id,
                'name' => 'Patek Philippe Nautilus 5711/1A-010',
                'model' => 'Stainless Steel',
                'suggested_price' => 92000.00,
                'description' => 'Ref. 5711/1A-010. Esfera azul con estrías horizontales. Caja y papeles originales.',
            ]);
        }

        $negWon = Negotiation::create([
            'lead_id' => $leadWon->id,
            'lead_proposal_id' => $proposalWon->id,
            'user_id' => $admin->id,
            'status' => NegotiationStatus::Agreed,
            'initial_price' => 95000.00,
            'final_price' => 92000.00,
            'notes' => 'Cliente negoció bajada de $3,000. Acordamos el precio.',
            'agreed_at' => now()->subDays(6),
        ]);

        NegotiationOffer::create([
            'negotiation_id' => $negWon->id,
            'user_id' => $admin->id,
            'type' => NegotiationOfferType::OurOffer,
            'amount' => 95000.00,
            'notes' => 'Precio inicial de lista.',
        ]);
        NegotiationOffer::create([
            'negotiation_id' => $negWon->id,
            'user_id' => $admin->id,
            'type' => NegotiationOfferType::ClientCounteroffer,
            'amount' => 90000.00,
            'notes' => 'Cliente ofrece $90,000 al contado.',
        ]);
        NegotiationOffer::create([
            'negotiation_id' => $negWon->id,
            'user_id' => $admin->id,
            'type' => NegotiationOfferType::OurOffer,
            'amount' => 92000.00,
            'notes' => 'Aceptamos $92,000 como precio final.',
        ]);

        // Lead: Negotiating — Ricardo con un Royal Oak
        $leadNegotiating = Lead::create([
            'client_id' => $clientRicardo->id,
            'assigned_to' => $admin->id,
            'title' => 'Audemars Piguet Royal Oak Offshore',
            'status' => LeadStatus::Negotiating,
            'source' => LeadSource::Referral,
            'product_interest' => 'Royal Oak Offshore Chronograph',
            'expected_value' => 38000.00,
            'notes' => 'Cliente evaluando entre dos referencias.',
            'closed_at' => null,
        ]);

        LeadInteraction::create([
            'lead_id' => $leadNegotiating->id,
            'user_id' => $admin->id,
            'type' => 'email',
            'notes' => 'Enviamos catálogo de referencias Royal Oak Offshore disponibles.',
            'interacted_at' => now()->subDays(7),
        ]);
        LeadInteraction::create([
            'lead_id' => $leadNegotiating->id,
            'user_id' => $admin->id,
            'type' => 'whatsapp',
            'notes' => 'Cliente respondió interesado en la ref. 26470OR. Solicita cotización formal.',
            'interacted_at' => now()->subDays(3),
        ]);

        $proposalNeg = LeadProposal::create([
            'lead_id' => $leadNegotiating->id,
            'user_id' => $admin->id,
            'title' => 'Cotización Royal Oak Offshore 26470OR',
            'notes' => null,
            'status' => ProposalStatus::Sent,
            'sent_via' => 'whatsapp',
            'sent_at' => now()->subDays(2),
        ]);

        if ($products->count() > 1) {
            $product = $products->get(1);
            LeadProposalItem::create([
                'lead_proposal_id' => $proposalNeg->id,
                'product_id' => $product->id,
                'product_variant_id' => $product->variants->first()?->id,
                'name' => 'Audemars Piguet Royal Oak Offshore 26470OR',
                'model' => 'Rose Gold',
                'suggested_price' => 38500.00,
                'description' => 'Ref. 26470OR.OO.1000OR.01. Caja y papeles completos. Año 2023.',
            ]);
        }

        Negotiation::create([
            'lead_id' => $leadNegotiating->id,
            'lead_proposal_id' => $proposalNeg->id,
            'user_id' => $admin->id,
            'status' => NegotiationStatus::Negotiating,
            'initial_price' => 38500.00,
            'final_price' => null,
            'notes' => 'Cliente aún evaluando. Esperando respuesta.',
            'agreed_at' => null,
        ]);

        // Lead: Contacted — Marta pendiente de seguimiento
        $leadContacted = Lead::create([
            'client_id' => $clientMarta->id,
            'assigned_to' => $admin->id,
            'title' => 'Anillo Cartier Panthère',
            'status' => LeadStatus::Contacted,
            'source' => LeadSource::Referral,
            'product_interest' => 'Joyería Cartier',
            'expected_value' => 12000.00,
            'notes' => 'Referida por Sofía. Busca un anillo de compromiso de lujo.',
            'closed_at' => null,
        ]);

        LeadInteraction::create([
            'lead_id' => $leadContacted->id,
            'user_id' => $admin->id,
            'type' => 'call',
            'notes' => 'Primera llamada. Confirmó interés en joyería Cartier. Agendar visita a tienda.',
            'interacted_at' => now()->subDays(2),
        ]);

        // Lead: New — Emilio walk-in
        Lead::create([
            'client_id' => $clientEmilio->id,
            'assigned_to' => $admin->id,
            'title' => 'Pulsera Hermes para regalo',
            'status' => LeadStatus::New,
            'source' => LeadSource::WalkIn,
            'product_interest' => 'Joyería Hermès',
            'expected_value' => 8500.00,
            'notes' => 'Walk-in en tienda. Busca regalo de aniversario. Sin urgencia de tiempo definida.',
            'closed_at' => null,
        ]);

        // Lead: Lost — cliente portal, no cerró
        $leadLost = Lead::create([
            'client_id' => $clientRecord->id,
            'assigned_to' => $admin->id,
            'title' => 'Rolex Daytona Rainbow',
            'status' => LeadStatus::Lost,
            'source' => LeadSource::Web,
            'product_interest' => 'Rolex Daytona',
            'expected_value' => 245000.00,
            'notes' => 'Cliente evaluó pero decidió comprar en otra plataforma.',
            'closed_at' => now()->subDays(10),
        ]);

        LeadInteraction::create([
            'lead_id' => $leadLost->id,
            'user_id' => $admin->id,
            'type' => 'email',
            'notes' => 'Enviamos propuesta de precio competitivo. Sin respuesta por 5 días.',
            'interacted_at' => now()->subDays(14),
        ]);
        LeadInteraction::create([
            'lead_id' => $leadLost->id,
            'user_id' => $admin->id,
            'type' => 'whatsapp',
            'notes' => 'Cliente informó que encontró precio mejor en otra tienda.',
            'interacted_at' => now()->subDays(10),
        ]);
    }
}
