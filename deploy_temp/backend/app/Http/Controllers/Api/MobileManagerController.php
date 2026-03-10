<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerApp;
use App\Models\Sale;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class MobileManagerController extends Controller
{
    public function dashboard()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_customers' => CustomerApp::count(),
                'active_customers' => CustomerApp::where('is_blocked', false)->count(),
                'pending_orders' => Sale::whereNotNull('customer_app_id')->where('payment_status', 'pending')->count(),
                'total_orders' => Sale::whereNotNull('customer_app_id')->count(),
                'total_order_value' => Sale::whereNotNull('customer_app_id')->sum('total_amount'),
                'total_unread_messages' => ChatMessage::where('is_from_customer', true)->where('is_read', false)->count(),
                'app_revenue' => Sale::whereNotNull('customer_app_id')
                                    ->where(function($q) {
                                        $q->where('payment_status', 'paid')
                                          ->orWhere('cancellation_fee', '>', 0);
                                    })->sum('amount_paid'),
                'total_promotions' => \App\Models\Promotion::count(),
                'active_promotions' => \App\Models\Promotion::where('is_active', true)->count(),
                'recent_registrations' => CustomerApp::latest()->limit(5)->get(),
                'recent_orders' => Sale::whereNotNull('customer_app_id')
                    ->with('customerApp')
                    ->latest()
                    ->limit(5)
                    ->get(),
                'recent_promotions' => \App\Models\Promotion::latest()->limit(5)->get(),
                'recent_messages' => ChatMessage::with('customer')
                    ->where('is_from_customer', true)
                    ->latest()
                    ->limit(5)
                    ->get(),
                'revenue_trend' => Sale::whereNotNull('customer_app_id')
                    ->where('sale_date', '>=', now()->subDays(30))
                    ->where(function($q) {
                        $q->where('payment_status', 'paid')
                          ->orWhere('cancellation_fee', '>', 0);
                    })
                    ->select(
                        DB::raw('DATE(sale_date) as date'),
                        DB::raw('SUM(amount_paid) as revenue')
                    )
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get(),
            ]
        ]);
    }

    public function customers()
    {
        $customers = CustomerApp::latest()->paginate(20);
        return response()->json([
            'success' => true,
            'data' => $customers
        ]);
    }

    public function updateCustomer(Request $request, $id)
    {
        $customer = CustomerApp::findOrFail($id);
        $request->validate([
            'full_name' => 'sometimes|string|max:100',
            'phone'     => 'sometimes|string|unique:customerApp,phone,' . $id . ',customer_id',
            'status'    => 'sometimes|string',
        ]);

        $customer->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Customer updated successfully',
            'data' => $customer
        ]);
    }

    public function toggleBlock($id)
    {
        $customer = CustomerApp::findOrFail($id);
        $customer->is_blocked = !$customer->is_blocked;
        $customer->save();

        return response()->json([
            'success' => true,
            'message' => $customer->is_blocked ? 'Customer blocked' : 'Customer unblocked',
            'data' => $customer
        ]);
    }

    public function orders()
    {
        $orders = Sale::whereNotNull('customer_app_id')
            ->with(['customerApp', 'items.product'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    public function updateOrderStatus(Request $request, $id)
    {
        $sale = Sale::whereNotNull('customer_app_id')->findOrFail($id);
        $request->validate(['status' => 'required|in:paid,cancelled,pending']);

        $oldStatus = $sale->payment_status;
        $sale->payment_status = $request->status;

        if ($request->status === 'paid' && $oldStatus !== 'paid') {
            // When completing, it's now a full sale
            $sale->amount_paid = $sale->total_amount;
            $sale->balance_due = 0;
            $sale->save();

            // Decrement customer balance (cleared debt)
            if ($sale->customerApp) {
                $sale->customerApp->decrement('current_balance', (float)$sale->total_amount);
            }

            // Record in general accounting
            $recorder = new class { use \App\Traits\FinancialRecorder; };
            $recorder->recordTransaction(
                'sale',
                $sale->total_amount,
                "Mobile App Order: {$sale->invoice_number}",
                $sale->sale_id,
                'sales',
                $sale->payment_method ?: 'cash'
            );
        } elseif ($request->status === 'cancelled' && $oldStatus !== 'cancelled') {
            // If it was pending, remove the original debt from customer balance
            if ($oldStatus === 'pending' && $sale->customerApp) {
                $sale->customerApp->decrement('current_balance', (float)$sale->total_amount);
            }

            // Apply cancellation fee
            $fee = 5.00; // Hardcoded $5 fee as requested/typical
            $sale->cancellation_fee = $fee;
            $sale->amount_paid = $fee; 
            $sale->total_amount = $fee; // Adjust total to just the fee for accounting
            $sale->balance_due = 0;
            $sale->save();

            // Record fee as income
            $recorder = new class { use \App\Traits\FinancialRecorder; };
            $recorder->recordTransaction(
                'income',
                $fee,
                "Cancellation Fee: {$sale->invoice_number}",
                $sale->sale_id,
                'sales',
                'cash'
            );
        } else {
            $sale->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Order status updated' . ($request->status === 'cancelled' ? ' with fee' : ''),
            'data' => $sale
        ]);
    }

    public function chats()
    {
        // Get the ID of the last message for each customer to avoid N+1 queries
        $lastMessageIds = ChatMessage::selectRaw('MAX(id) as id')
            ->groupBy('customer_id')
            ->pluck('id');

        // Unread counts: messages FROM the customer that haven't been read by the manager
        $unreadCounts = ChatMessage::where('is_from_customer', true)
            ->where('is_read', false)
            ->groupBy('customer_id')
            ->selectRaw('customer_id, COUNT(*) as unread_count')
            ->pluck('unread_count', 'customer_id');

        $chats = ChatMessage::with('customer')
            ->whereIn('id', $lastMessageIds)
            ->latest()
            ->get()
            ->map(function ($msg) use ($unreadCounts) {
                return [
                    'customer'     => $msg->customer,
                    'last_message' => $msg,
                    'chat_status'  => $msg->customer->chat_status ?? 'open',
                    'unread_count' => $unreadCounts[$msg->customer_id] ?? 0,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $chats
        ]);
    }

    public function messages($customerId)
    {
        $customer = CustomerApp::find($customerId);
        
        if (!$customer) {
            return response()->json([
                'success' => false, 
                'message' => 'Customer not found'
            ], 404);
        }

        $messages = ChatMessage::where('customer_id', $customerId)
            ->oldest()
            ->get();

        // Mark all unread customer messages as read (manager opened the chat)
        ChatMessage::where('customer_id', $customerId)
            ->where('is_from_customer', true)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'success'     => true,
            'data'        => $messages,
            'chat_status' => $customer->chat_status ?? 'open',
        ]);
    }

    public function sendMessage(Request $request, $customerId)
    {
        $request->validate([
            'message' => 'nullable|string',
            'image'   => 'nullable|image|max:4096',
        ]);

        if (!$request->filled('message') && !$request->hasFile('image')) {
            return response()->json(['success' => false, 'message' => 'Message or image is required.'], 422);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            \Illuminate\Support\Facades\Log::info('Manager image upload attempt', [
                'customer_id' => $customerId,
                'files' => $request->allFiles()
            ]);
            $imagePath = $request->file('image')->store('chat_images', 'public');
        }

        $message = ChatMessage::create([
            'customer_id'      => $customerId,
            'user_id'          => auth()->id(),
            'message'          => $request->message ?? '[Image]',
            'image_path'       => $imagePath,
            'is_from_customer' => false,
            'is_read'          => false,
        ]);

        return response()->json([
            'success' => true,
            'data' => $message,
        ]);
    }

    public function endChat($customerId)
    {
        $customer = CustomerApp::findOrFail($customerId);
        $customer->update([
            'chat_status'  => 'closed',
            'needs_rating' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Chat ended. Customer will be prompted to rate.',
        ]);
    }

    public function reopenChat($customerId)
    {
        $customer = CustomerApp::findOrFail($customerId);
        $customer->update([
            'chat_status'  => 'open',
            'needs_rating' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Chat reopened.',
        ]);
    }
}
