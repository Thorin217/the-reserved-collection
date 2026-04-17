<?php

namespace App\Listeners;

use App\Events\ProductsImportCompleted;
use App\Notifications\ProductsImportCompletedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendProductsImportCompletedNotification implements ShouldQueue
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(ProductsImportCompleted $event): void
    {
        $user = $event->import->user;

        if (! $user) {
            return;
        }

        $user->notify(new ProductsImportCompletedNotification($event->import));
    }
}
