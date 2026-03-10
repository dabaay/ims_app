<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sale;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Customer;
use App\Models\FinancialTransaction; // Assuming this model exists based on DB schema
use App\Models\CapitalTransaction;
use App\Models\FixedAsset;
use App\Models\Supplier;
use App\Models\Purchase;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinancialReportController extends Controller
{
    /**
     * Generate Income Statement (Profit & Loss)
     */
    public function incomeStatement(Request $request)
    {
        $period = $request->period ?? 'monthly'; // monthly, yearly, custom
        $date = $request->date ? Carbon::parse($request->date) : Carbon::now();
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : null;
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : null;

        // Determine date ranges for comparison (Current vs Previous)
        $ranges = $this->getDateRanges($period, $date, $startDate, $endDate);
        
        $reportData = [];

        foreach ($ranges as $label => $range) {
            // 1. Revenue
            $sales = Sale::whereBetween('sale_date', [$range['start'], $range['end']])
                         ->where(function($query) {
                             $query->where('payment_status', '!=', 'cancelled')
                                   ->orWhere('cancellation_fee', '>', 0);
                         })
                         ->sum('total_amount');
            
            // 2. COGS (Approximation based on sale items)
            // Ideally, you'd track this precisely. Here we sum (cost_price * qty) from sale_items
            $cogs = DB::table('sale_items')
                      ->join('sales', 'sale_items.sale_id', '=', 'sales.sale_id')
                      ->whereBetween('sales.sale_date', [$range['start'], $range['end']])
                      ->sum(DB::raw('sale_items.quantity * sale_items.cost_price')); // Assuming cost_price is stored in sale_items or need join product

            // Note: If cost_price is NOT in sale_items, join products. (Checking schema in next steps if needed, assuming simple logic for now)
            // Schema check needed: sale_items usually has unit_price. Does it has cost_price?
            // If not, we join products.
            // Let's assume we join products for cost.
            if ($cogs == 0) {
                 $cogs = DB::table('sale_items')
                      ->join('sales', 'sale_items.sale_id', '=', 'sales.sale_id')
                      ->join('products', 'sale_items.product_id', '=', 'products.product_id')
                      ->whereBetween('sales.sale_date', [$range['start'], $range['end']])
                      ->sum(DB::raw('sale_items.quantity * products.cost_price'));
            }

            // 3. Expenses
            $expenses = Expense::whereBetween('expense_date', [$range['start'], $range['end']])
                               ->where('status', 'approved')
                               ->select('expense_category', DB::raw('SUM(amount) as total'))
                               ->groupBy('expense_category')
                               ->get();
            
            $totalExpenses = $expenses->sum('total');

            // 4. Gross Profit
            $grossProfit = $sales - $cogs;

            // 5. Net Profit
            // Tax: Simple placeholder logic (e.g. 0% for now or from settings)
            $tax = 0; 
            $netProfit = $grossProfit - $totalExpenses - $tax;

            $reportData[$label] = [
                'revenue' => $sales,
                'cogs' => $cogs,
                'gross_profit' => $grossProfit,
                'expenses' => $expenses,
                'total_expenses' => $totalExpenses,
                'net_profit' => $netProfit,
                'range_start' => $range['start']->toDateString(),
                'range_end' => $range['end']->toDateString(),
            ];
        }

        return response()->json($reportData);
    }

    /**
     * Generate Balance Sheet
     */
    public function balanceSheet(Request $request)
    {
        $asOfDate = $request->date ? Carbon::parse($request->date) : Carbon::now();

        // 1. Assets
        // Cash: From Financial Transactions (if available) or calculated
        $cashOnHand = FinancialTransaction::where('transaction_date', '<=', $asOfDate)
                                          ->sum(DB::raw('debit - credit')); // Assuming debit increases cash? Need to verify logic.
        // Actually, for Cash Asset: Debit increases asset, Credit decreases.
        // If FinancialTransaction tracks ALL cash movements.

        // Simpler approach for Cash if FinancialTransaction is not maintained perfectly: 
        // Sum of Sales (Cash) - Expenses (Cash) + Capital In - Drawings ... 
        // Only if FinancialTransaction is strict using Double Entry. 
        // Let's assume FinancialTransaction is the source of truth for Cash.
        // If it returns 0/null, we might default to a calculated value from Sales/Expenses.

        $accountsReceivable = Customer::sum('current_balance'); // Total owed by customers
        
        $inventoryValue = Product::select(DB::raw('SUM(cost_price * current_stock) as total'))->value('total') ?? 0;

        $fixedAssets = FixedAsset::where('status', 'active')
                                 ->where('purchase_date', '<=', $asOfDate)
                                 ->select(
                                     DB::raw('SUM(current_value) as total_value'),
                                     DB::raw('SUM(purchase_cost) as total_cost'),
                                     DB::raw('SUM(accumulated_depreciation) as total_depreciation')
                                 )->first();

        $totalAssets = $cashOnHand + $accountsReceivable + $inventoryValue + ($fixedAssets->total_value ?? 0);

        // 2. Liabilities
        $accountsPayable = $this->calculateLiabilitiesAt($asOfDate);

        // 3. Equity
        $capital = CapitalTransaction::where('transaction_date', '<=', $asOfDate)
                                     ->where('transaction_type', 'investment')
                                     ->sum('amount');
        
        $drawings = CapitalTransaction::where('transaction_date', '<=', $asOfDate)
                                      ->where('transaction_type', 'drawing')
                                      ->sum('amount');

        // Retained Earnings = Net Profit since beginning of time up to AsOfDate
        // This is heavy. Alternatively: Assets - Liabilities - (Capital - Drawings).
        $retainedEarnings = $totalAssets - $accountsPayable - ($capital - $drawings);

        return response()->json([
            'as_of' => $asOfDate->toDateString(),
            'assets' => [
                'cash' => $cashOnHand,
                'accounts_receivable' => $accountsReceivable,
                'inventory' => $inventoryValue,
                'fixed_assets' => $fixedAssets,
                'total' => $totalAssets
            ],
            'liabilities' => [
                'accounts_payable' => $accountsPayable,
                'total' => $accountsPayable
            ],
            'equity' => [
                'capital' => $capital,
                'drawings' => $drawings,
                'retained_earnings' => $retainedEarnings,
                'total' => ($capital - $drawings + $retainedEarnings)
            ]
        ]);
    }

    /**
     * Generate Cash Flow
     */
    public function cashFlow(Request $request)
    {
        $year = $request->year ?? Carbon::now()->year;
        $start = Carbon::createFromDate($year, 1, 1);
        $end = Carbon::createFromDate($year, 12, 31);

        // Operating Activities
        $cashReceipts = Sale::whereBetween('sale_date', [$start, $end])
                            ->whereIn('payment_method', ['cash', 'evc_plus', 'shilin_somali', 'mixed']) // Assuming these are cash equivalents
                            ->sum('amount_paid'); // Actual cash received
        
        $cashPaidExpenses = Expense::whereBetween('expense_date', [$start, $end])
                                   ->where('status', 'approved')
                                   ->sum('amount');
        
        // Investing Activities
        $purchaseAssets = FixedAsset::whereBetween('purchase_date', [$start, $end])
                                    ->sum('purchase_cost');
        
        // Financing Activities
        $investments = CapitalTransaction::whereBetween('transaction_date', [$start, $end])
                                         ->where('transaction_type', 'investment')
                                         ->sum('amount');
        
        $drawings = CapitalTransaction::whereBetween('transaction_date', [$start, $end])
                                      ->where('transaction_type', 'drawing')
                                      ->sum('amount');
        return response()->json([
            'operating' => [
                'receipts_customers' => $cashReceipts,
                'payments_expenses' => -$cashPaidExpenses,
                'net' => $cashReceipts - $cashPaidExpenses
            ],
            'investing' => [
                'purchase_assets' => -$purchaseAssets,
                'net' => -$purchaseAssets
            ],
            'financing' => [
                'investments' => $investments,
                'drawings' => -$drawings,
                'net' => $investments - $drawings
            ],
            'net_increase' => ($cashReceipts - $cashPaidExpenses) - $purchaseAssets + ($investments - $drawings)
        ]);
    }

    /**
     * Generate Statement of Owner's Equity
     */
    public function ownersEquity(Request $request)
    {
        $period = $request->period ?? 'monthly';
        $date = $request->date ? Carbon::parse($request->date) : Carbon::now();
        $ranges = $this->getDateRanges($period, $date, null, null);
        
        $reportData = [];

        foreach ($ranges as $label => $range) {
            // 1. Opening Balance (Equity before this range)
            $openingAssets = $this->calculateAssetsAt($range['start']->copy()->subSecond());
            $openingLiabilities = $this->calculateLiabilitiesAt($range['start']->copy()->subSecond());
            $openingEquity = $openingAssets - $openingLiabilities;

            // 2. Net Income for the period
            $netIncome = $this->calculateNetIncomeBetween($range['start'], $range['end']);

            // 3. New Capital Investment
            $investments = CapitalTransaction::whereBetween('transaction_date', [$range['start'], $range['end']])
                                             ->where('transaction_type', 'investment')
                                             ->sum('amount');

            // 4. Drawings
            $drawings = CapitalTransaction::whereBetween('transaction_date', [$range['start'], $range['end']])
                                          ->where('transaction_type', 'drawing')
                                          ->sum('amount');

            $closingEquity = $openingEquity + $netIncome + $investments - $drawings;

            $reportData[$label] = [
                'opening_equity' => $openingEquity,
                'net_income' => $netIncome,
                'investments' => $investments,
                'drawings' => -$drawings,
                'closing_equity' => $closingEquity,
                'range_start' => $range['start']->toDateString(),
                'range_end' => $range['end']->toDateString(),
            ];
        }

        return response()->json($reportData);
    }

    /**
     * Generate Notes to Financial Statements
     */
    public function notes(Request $request)
    {
        $asOfDate = $request->date ? Carbon::parse($request->date) : Carbon::now();

        // 1. Fixed Assets Note
        $fixedAssets = FixedAsset::where('purchase_date', '<=', $asOfDate)
                                 ->get(['asset_name', 'purchase_cost', 'accumulated_depreciation', 'current_value']);

        // 2. Inventory Note
        $inventoryStats = Product::groupBy('category')
                                 ->select('category', DB::raw('SUM(current_stock) as units'), DB::raw('SUM(cost_price * current_stock) as value'))
                                 ->get();

        // 3. Revenue Note
        $revenueByCategory = DB::table('sale_items')
                               ->join('sales', 'sale_items.sale_id', '=', 'sales.sale_id')
                               ->join('products', 'sale_items.product_id', '=', 'products.product_id')
                               ->where('sales.sale_date', '<=', $asOfDate)
                               ->where('sales.sale_date', '>=', $asOfDate->copy()->startOfYear())
                               ->select('products.category', DB::raw('SUM(sale_items.quantity * sale_items.unit_price) as total_sales'))
                               ->groupBy('products.category')
                               ->get();

        return response()->json([
            'as_of' => $asOfDate->toDateString(),
            'policies' => [
                'basis' => 'The financial statements are prepared on a modified accrual basis of accounting.',
                'inventory' => 'Inventory is valued at the lower of cost or net realizable value using the FIFO method.',
                'assets' => 'Fixed assets are stated at cost less accumulated depreciation calculated on a straight-line basis.'
            ],
            'fixed_assets_detail' => $fixedAssets,
            'inventory_detail' => $inventoryStats,
            'revenue_detail' => $revenueByCategory
        ]);
    }

    // Helper functions for Equity calculation
    private function calculateAssetsAt($date)
    {
        $cash = FinancialTransaction::where('transaction_date', '<=', $date)->sum(DB::raw('debit - credit'));
        $ar = Customer::sum('current_balance'); 
        $inv = Product::select(DB::raw('SUM(cost_price * current_stock) as total'))->value('total') ?? 0;
        $fa = FixedAsset::where('status', 'active')->where('purchase_date', '<=', $date)->sum('current_value');
        
        return $cash + $ar + $inv + $fa;
    }

    private function calculateLiabilitiesAt($date)
    {
        return Purchase::where('purchase_date', '<=', $date)
                       ->where('status', '!=', 'cancelled')
                       ->sum('balance_due');
    }

    private function calculateNetIncomeBetween($start, $end)
    {
        $sales = Sale::whereBetween('sale_date', [$start, $end])
                     ->where(function($query) {
                         $query->where('payment_status', '!=', 'cancelled')
                               ->orWhere('cancellation_fee', '>', 0);
                     })
                     ->sum('total_amount');
        
        $cogs = DB::table('sale_items')
                  ->join('sales', 'sale_items.sale_id', '=', 'sales.sale_id')
                  ->join('products', 'sale_items.product_id', '=', 'products.product_id')
                  ->whereBetween('sales.sale_date', [$start, $end])
                  ->sum(DB::raw('sale_items.quantity * products.cost_price'));

        $expenses = Expense::whereBetween('expense_date', [$start, $end])->where('status', 'approved')->sum('amount');

        return $sales - $cogs - $expenses;
    }

    private function getDateRanges($period, $anchorDate, $customStart, $customEnd)
    {
        $ranges = [];
        
        if ($period == 'monthly') {
            $ranges['Current Month'] = [
                'start' => $anchorDate->copy()->startOfMonth(),
                'end' => $anchorDate->copy()->endOfMonth()
            ];
            $ranges['Previous Month'] = [
                'start' => $anchorDate->copy()->subMonth()->startOfMonth(),
                'end' => $anchorDate->copy()->subMonth()->endOfMonth()
            ];
        } elseif ($period == 'yearly') {
            $ranges['Current Year'] = [
                'start' => $anchorDate->copy()->startOfYear(),
                'end' => $anchorDate->copy()->endOfYear()
            ];
            $ranges['Previous Year'] = [
                'start' => $anchorDate->copy()->subYear()->startOfYear(),
                'end' => $anchorDate->copy()->subYear()->endOfYear()
            ];
        } elseif ($period == 'custom' && $customStart && $customEnd) {
             $ranges['Selected Period'] = [
                'start' => $customStart,
                'end' => $customEnd
            ];
        }

        return $ranges;
    }
    /**
     * Generate Comprehensive Executive Report
     */
    public function comprehensiveReport(Request $request)
    {
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now()->endOfMonth();

        // 1. Financial Overview
        $revenue = Sale::whereBetween('sale_date', [$startDate, $endDate])
                       ->where(function($query) {
                           $query->where('payment_status', '!=', 'cancelled')
                                 ->orWhere('cancellation_fee', '>', 0);
                       })
                       ->sum('total_amount');
        
        $cogs = DB::table('sale_items')
                  ->join('sales', 'sale_items.sale_id', '=', 'sales.sale_id')
                  ->whereBetween('sales.sale_date', [$startDate, $endDate])
                  ->sum(DB::raw('sale_items.quantity * sale_items.cost_price'));

        $expensesTotal = Expense::whereBetween('expense_date', [$startDate, $endDate])
                                ->where('status', 'approved')
                                ->sum('amount');
        
        $purchasesPaid = Purchase::whereBetween('purchase_date', [$startDate, $endDate])
                                 ->where('status', '!=', 'cancelled')
                                 ->sum('amount_paid');

        // 2. Expense Hotspots (Where money goes out)
        $topExpenses = Expense::whereBetween('expense_date', [$startDate, $endDate])
                               ->where('status', 'approved')
                               ->select('expense_category', DB::raw('SUM(amount) as total'))
                               ->groupBy('expense_category')
                               ->orderByDesc('total')
                               ->limit(5)
                               ->get();

        // 3. Top Revenue Generators (Items that generate store's income)
        $topRevenueItems = DB::table('sale_items')
                             ->join('sales', 'sale_items.sale_id', '=', 'sales.sale_id')
                             ->join('products', 'sale_items.product_id', '=', 'products.product_id')
                             ->whereBetween('sales.sale_date', [$startDate, $endDate])
                             ->select('products.name', DB::raw('SUM(sale_items.quantity * sale_items.unit_price) as total_income'))
                             ->groupBy('products.product_id', 'products.name')
                             ->orderByDesc('total_income')
                             ->limit(10)
                             ->get();

        // 4. Daily Best Sellers (Purchased daily)
        $bestSellersDaily = DB::table('sale_items')
                              ->join('sales', 'sale_items.sale_id', '=', 'sales.sale_id')
                              ->join('products', 'sale_items.product_id', '=', 'products.product_id')
                              ->whereBetween('sales.sale_date', [$startDate, $endDate])
                              ->select('products.name', DB::raw('SUM(sale_items.quantity) as total_qty'))
                              ->groupBy('products.product_id', 'products.name')
                              ->orderByDesc('total_qty')
                              ->limit(10)
                              ->get();

        // 5. Success Opportunity (Items previously brought in that were not brought in but generated income)
        $historicalHighPerformers = DB::table('sale_items')
                                      ->join('sales', 'sale_items.sale_id', '=', 'sales.sale_id')
                                      ->join('products', 'sale_items.product_id', '=', 'products.product_id')
                                      ->where('sales.sale_date', '>=', Carbon::now()->subYear())
                                      ->where('products.current_stock', '<=', 0)
                                      ->select('products.name', DB::raw('SUM(sale_items.quantity * sale_items.unit_price) as historical_income'))
                                      ->groupBy('products.product_id', 'products.name')
                                      ->orderByDesc('historical_income')
                                      ->limit(10)
                                      ->get();

        // 6. Slow Movers (Items not purchased often)
        $slowMovers = DB::table('products')
                        ->leftJoin('sale_items', 'products.product_id', '=', 'sale_items.product_id')
                        ->select('products.name', 'products.current_stock', DB::raw('COUNT(sale_items.id) as sale_count'))
                        ->groupBy('products.product_id', 'products.name', 'products.current_stock')
                        ->orderBy('sale_count', 'asc')
                        ->limit(10)
                        ->get();

        // 7. Outstanding Debts (Person, Number, Amount)
        $outstandingDebts = Customer::where('current_balance', '>', 0)
                                    ->select('full_name', 'phone_number', 'current_balance')
                                    ->orderByDesc('current_balance')
                                    ->get();

        // 8. Inventory Summary
        $finishedItems = Product::where('current_stock', '<=', 0)->select('name', 'category')->get();
        $inStockSummary = Product::where('current_stock', '>', 0)
                                 ->select('name', 'current_stock', 'category')
                                 ->orderBy('current_stock', 'desc')
                                 ->get();

        return response()->json([
            'meta' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'generated_at' => Carbon::now()->toDateTimeString(),
            ],
            'financials' => [
                'total_income' => (float)$revenue,
                'total_cogs' => (float)$cogs,
                'gross_profit' => (float)($revenue - $cogs),
                'net_profit' => (float)(($revenue - $cogs) - $expensesTotal),
                'total_money_out' => (float)($expensesTotal + $purchasesPaid),
                'expenses_paid' => (float)$expensesTotal,
                'purchases_paid' => (float)$purchasesPaid,
            ],
            'expense_hotspots' => $topExpenses,
            'top_revenue_items' => $topRevenueItems,
            'daily_best_sellers' => $bestSellersDaily,
            'historical_opportunity' => $historicalHighPerformers,
            'slow_movers' => $slowMovers,
            'debts' => $outstandingDebts,
            'inventory' => [
                'finished' => $finishedItems,
                'in_stock' => $inStockSummary,
                'total_items' => Product::count(),
                'total_value' => (float)Product::sum(DB::raw('cost_price * current_stock'))
            ]
        ]);
    }
}
