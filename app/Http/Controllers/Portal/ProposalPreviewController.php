<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Resources\LeadProposalResource;
use App\Http\Resources\LeadResource;
use App\Models\LeadProposal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProposalPreviewController extends Controller
{
    public function show(Request $request, LeadProposal $proposal): Response
    {
        abort_unless($request->hasValidSignature(), 410);

        $proposal->load([
            'lead.client',
            'items.product.brand',
            'items.product.media',
            'items.variant',
            'items.serial',
        ]);

        return Inertia::render('portal/proposals/preview', [
            'proposal' => LeadProposalResource::make($proposal),
            'lead' => LeadResource::make($proposal->lead),
        ]);
    }
}
