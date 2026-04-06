<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLeadInteractionRequest;
use App\Models\Lead;
use App\Models\LeadInteraction;
use Illuminate\Http\RedirectResponse;

class LeadInteractionController extends Controller
{
    public function store(StoreLeadInteractionRequest $request, Lead $lead): RedirectResponse
    {
        $lead->interactions()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
            'interacted_at' => now(),
        ]);

        return redirect()->route('admin.leads.show', $lead)->with('success', 'Interaction logged.');
    }

    public function destroy(Lead $lead, LeadInteraction $interaction): RedirectResponse
    {
        $interaction->delete();

        return redirect()->route('admin.leads.show', $lead)->with('success', 'Interaction deleted.');
    }
}
