<?php

namespace App\Actions\Finance;

use App\Enums\PaymentStatus;
use App\Models\AccountReceivable;
use App\Models\ReceivablePayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordReceivablePayment
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(AccountReceivable $receivable, array $data): ReceivablePayment
    {
        return DB::transaction(function () use ($receivable, $data): ReceivablePayment {
            if ($receivable->status === PaymentStatus::Paid || $receivable->status === PaymentStatus::Cancelled) {
                throw ValidationException::withMessages([
                    'amount' => 'This receivable is already settled or cancelled.',
                ]);
            }

            $amount = (float) $data['amount'];
            $balanceDue = (float) $receivable->balance_due;

            if ($amount > $balanceDue) {
                throw ValidationException::withMessages([
                    'amount' => 'Payment amount cannot exceed the balance due of '.number_format($balanceDue, 2).'.',
                ]);
            }

            $payment = $receivable->payments()->create([
                'amount' => $amount,
                'payment_method' => $data['payment_method'],
                'payment_date' => $data['payment_date'],
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $newPaidAmount = (float) $receivable->paid_amount + $amount;
            $newBalanceDue = max(0, $balanceDue - $amount);

            $newStatus = match (true) {
                $newBalanceDue <= 0 => PaymentStatus::Paid,
                $newPaidAmount > 0 => PaymentStatus::Partial,
                default => PaymentStatus::Pending,
            };

            $receivable->forceFill([
                'paid_amount' => $newPaidAmount,
                'balance_due' => $newBalanceDue,
                'status' => $newStatus,
                'paid_at' => $newBalanceDue <= 0 ? now() : $receivable->paid_at,
            ])->save();

            return $payment;
        });
    }
}
