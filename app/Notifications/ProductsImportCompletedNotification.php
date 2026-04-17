<?php

namespace App\Notifications;

use App\Enums\ImportStatus;
use App\Models\Import;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProductsImportCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public Import $import)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $statusLabel = match ($this->import->status) {
            ImportStatus::Completed => 'Completed',
            ImportStatus::CompletedWithErrors => 'Completed with errors',
            ImportStatus::Failed => 'Failed',
            default => 'Processing finished',
        };

        return (new MailMessage)
            ->subject('Products import '.$statusLabel)
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your products import has finished processing.')
            ->line('Status: '.$statusLabel)
            ->line('Processed rows: '.(string) $this->import->processed_rows)
            ->line('Successful rows: '.(string) $this->import->successful_rows)
            ->line('Failed rows: '.(string) $this->import->failed_rows)
            ->action('Go to products', url('/admin/products'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'import_id' => $this->import->id,
            'status' => $this->import->status?->value,
            'processed_rows' => $this->import->processed_rows,
            'successful_rows' => $this->import->successful_rows,
            'failed_rows' => $this->import->failed_rows,
        ];
    }
}
