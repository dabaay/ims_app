<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ChatController extends Controller
{
    public function index(Request $request)
    {
        $customer = $request->user('customer');
        $customerId = $customer->customer_id;

        $messages = ChatMessage::where('customer_id', $customerId)
            ->with('user:user_id,full_name')
            ->orderBy('created_at')
            ->get();

        // Mark unread messages from store as read
        ChatMessage::where('customer_id', $customerId)
            ->where('is_from_customer', false)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'data'    => $messages,
            'chat_status' => $customer->chat_status,
            'needs_rating' => $customer->needs_rating,
        ]);
    }

    public function store(Request $request)
    {
        $customer = $request->user('customer');
        
        if ($customer->chat_status === 'closed') {
            return response()->json([
                'success' => false,
                'message' => 'Chat is closed. Please wait for a manager to reopen it.',
            ], 403);
        }

        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $customerId = $customer->customer_id;

        $msg = ChatMessage::create([
            'customer_id'      => $customerId,
            'user_id'          => null,
            'message'          => $request->message,
            'is_from_customer' => true,
            'is_read'          => false,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $msg,
        ], 201);
    }

    public function uploadScreenshot(Request $request)
    {
        $customer = $request->user('customer');
        
        if ($customer->chat_status === 'closed') {
            return response()->json([
                'success' => false,
                'message' => 'Chat is closed. Please wait for a manager to reopen it.',
            ], 403);
        }

        $request->validate([
            'image'   => 'required|image|max:4096',
            'message' => 'nullable|string|max:500',
        ]);

        $customerId = $customer->customer_id;

        \Illuminate\Support\Facades\Log::info('Customer Image upload attempt', [
            'customer_id' => $customerId,
            'files' => $request->allFiles(),
            'message' => $request->message
        ]);

        $path = $request->file('image')->store('chat_images', 'public');

        $msg = ChatMessage::create([
            'customer_id'      => $customerId,
            'user_id'          => null,
            'message'          => $request->message ?? '[Image]',
            'image_path'       => $path,
            'is_from_customer' => true,
            'is_read'          => false,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $msg,
        ], 201);
    }

    public function submitRating(Request $request)
    {
        $request->validate([
            'rating' => 'required|boolean', // 1 for like, 0 for unlike
        ]);

        $customer = $request->user('customer');
        $customer->update([
            'last_rating' => $request->rating,
            'needs_rating' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your feedback!',
        ]);
    }
}
