<?php

namespace App\Mail;

use App\Models\Lead;
use App\Models\LeadProposal;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProposalMailable extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly LeadProposal $proposal,
        public readonly Lead $lead,
        public readonly string $previewUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Proposal: {$this->proposal->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.proposal',
            with: [
                'proposal' => $this->proposal,
                'lead' => $this->lead,
                'client' => $this->lead->client,
                'items' => $this->proposal->items ?? collect(),
                'previewUrl' => $this->previewUrl,
            ],
        );
    }
}
