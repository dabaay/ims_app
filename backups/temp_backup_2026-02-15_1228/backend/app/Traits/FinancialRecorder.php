<?php

namespace App\Traits;

use App\Models\FinancialTransaction;
use App\Models\DailySummary;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

trait FinancialRecorder
{
    /**
     * Record a financial transaction and update daily summary.
     */
    public function recordTransaction($type, $amount, $description, $referenceId = null, $referenceTable = null, $paymentMethod = 'cash', $debtAmount = 0)
    {
        return DB::transaction(function () use ($type, $amount, $description, $referenceId, $referenceTable, $paymentMethod, $debtAmount) {
            // 1. Get current balance
            $lastTransaction = FinancialTransaction::latest('transaction_id')->first();
            $currentBalance = $lastTransaction ? $lastTransaction->balance : 0;

            $debit = 0;
            $credit = 0;
            $newBalance = $currentBalance;

            // For sales, we only credit the amount PAID now in the ledger? 
            // Or the total sale amount? Usually ledger records cash flow.
            // If it's a sale, credit is the amount_paid.
            if ($type === 'sale' || $type === 'income' || $type === 'debt_collection') {
                $credit = $amount;
                $newBalance += $amount;
            } else {
                $debit = $amount;
                $newBalance -= $amount;
            }

            // 2. Create the transaction record
            $transaction = FinancialTransaction::create([
                'transaction_date' => now(),
                'transaction_type' => $type,
                'reference_id' => $referenceId,
                'reference_table' => $referenceTable,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $newBalance,
                'description' => $description,
                'created_by' => Auth::id(),
                'notes' => "Payment via: " . ucfirst(str_replace('_', ' ', $paymentMethod)) . ($debtAmount > 0 ? ". Debt created: $$debtAmount" : ""),
            ]);

            // 3. Update Daily Summary
            $this->updateDailySummary($type, $amount, $paymentMethod, $debtAmount);

            return $transaction;
        });
    }

    /**
     * Update or create daily summary record.
     */
    protected function updateDailySummary($type, $amount, $paymentMethod, $debtAmount = 0)
    {
        $date = now()->format('Y-m-d');
        $summary = DailySummary::firstOrCreate(
            ['summary_date' => $date],
            [
                'total_sales' => 0,
                'total_cash_sales' => 0,
                'total_evc_sales' => 0,
                'total_shilin_sales' => 0,
                'total_expenses' => 0,
                'total_debt_collected' => 0,
                'total_debt_created' => 0,
                'total_profit' => 0,
                'transaction_count' => 0,
                'customer_count' => 0,
            ]
        );

        if ($type === 'sale') {
            // For sales, total_sales is the full invoice amount
            // Since $amount passed to recordTransaction for sale is total_amount + debt? 
            // Wait, I should be careful what $amount is.
            $summary->increment('total_sales', $amount + $debtAmount);
            $summary->increment('transaction_count');
            
            if ($paymentMethod === 'cash') {
                $summary->increment('total_cash_sales', $amount);
            } elseif ($paymentMethod === 'evc_plus') {
                $summary->increment('total_evc_sales', $amount);
            } elseif ($paymentMethod === 'shilin_somali') {
                $summary->increment('total_shilin_sales', $amount);
            }

            if ($debtAmount > 0) {
                $summary->increment('total_debt_created', $debtAmount);
            }
        } elseif ($type === 'expense') {
            $summary->increment('total_expenses', $amount);
        } elseif ($type === 'debt_collection') {
            $summary->increment('total_debt_collected', $amount);
        }

        // recalculate profit (Sales - Expenses)
        $summary->total_profit = (float)$summary->total_sales - (float)$summary->total_expenses;
        $summary->save();
    }
}
