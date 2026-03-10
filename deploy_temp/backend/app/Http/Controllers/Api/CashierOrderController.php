<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class CashierOrderController extends Controller
{
    /**
     * Get completed mobile orders for the cashier
     */
    public function completedOrders()
    {
        $orders = Sale::whereNotNull('customer_app_id')
            ->where('payment_status', 'paid')
            ->with(['customerApp', 'items.product'])
            ->latest()
            ->get();

        return response()->json($orders);
    }

    /**
     * Update delivery information for an order
     */
    public function updateDelivery(Request $request, $id)
    {
        $request->validate([
            'delivery_type' => 'required|in:none,bajaj,vekon,plane',
            'delivery_price' => 'required|numeric|min:0',
        ]);

        $sale = Sale::findOrFail($id);
        
        $oldPrice = $sale->delivery_price;
        $newPrice = $request->delivery_price;

        $sale->delivery_type = $request->delivery_type;
        $sale->delivery_price = $newPrice;
        
        // Adjust total amount if price changed
        // Subtract old delivery price and add new one
        $sale->total_amount = ($sale->total_amount - $oldPrice) + $newPrice;
        $sale->save();

        return response()->json([
            'success' => true,
            'message' => 'Delivery information updated successfully',
            'order' => $sale
        ]);
    }
}
