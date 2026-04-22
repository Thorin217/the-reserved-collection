<?php

namespace App\Actions\Finance;

use App\Enums\PaymentStatus;
use App\Models\AccountPayable;
use App\Models\PayablePayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordPayablePayment
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(AccountPayable $payable, array $data): PayablePayment
    {
        return DB::transaction(function () use ($payable, $data): PayablePayment {
            if ($payable->status === PaymentStatus::Paid || $payable->status === PaymentStatus::Cancelled) {
                throw ValidationException::withMessages([
                    'amount' => 'This payable is already settled or cancelled.',
                ]);
            }

            $amount = (float) $data['amount'];
            $balanceDue = (float) $payable->balance_due;

            if ($amount > $balanceDue) {
                throw ValidationException::withMessages([
                    'amount' => 'Payment amount cannot exceed the balance due of '.number_format($balanceDue, 2).'.',
                ]);
            }

            $payment = $payable->payments()->create([
                'amount' => $amount,
                'payment_method' => $data['payment_method'],
                'payment_date' => $data['payment_date'],
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            $newPaidAmount = (float) $payable->paid_amount + $amount;
            $newBalanceDue = max(0, $balanceDue - $amount);

            $newStatus = match (true) {
                $newBalanceDue <= 0 => PaymentStatus::Paid,
                $newPaidAmount > 0 => PaymentStatus::Partial,
                default => PaymentStatus::Pending,
            };

            $payable->forceFill([
                'paid_amount' => $newPaidAmount,
                'balance_due' => $newBalanceDue,
                'status' => $newStatus,
                'paid_at' => $newBalanceDue <= 0 ? now() : $payable->paid_at,
            ])->save();

            return $payment;
        });
    }
}
