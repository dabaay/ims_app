<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PromotionController extends Controller
{
    public function index()
    {
        $promotions = Promotion::with('product')->latest()->get();
        return response()->json([
            'success' => true,
            'data' => $promotions
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'required|image|max:5120', // 5MB max
            'product_id' => 'nullable|exists:products,product_id',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $imagePath = $request->file('image')->store('promotions', 'public');

        $promotion = Promotion::create([
            'title' => $request->title,
            'description' => $request->description,
            'image_path' => $imagePath,
            'product_id' => $request->product_id,
            'is_active' => $request->is_active ?? true,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);

        return response()->json([
            'success' => true,
            'data' => $promotion->load('product'),
            'message' => 'Promotion created successfully'
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $promotion = Promotion::findOrFail($id);

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:5120',
            'product_id' => 'nullable|exists:products,product_id',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image
            if ($promotion->image_path) {
                Storage::disk('public')->delete($promotion->image_path);
            }
            $promotion->image_path = $request->file('image')->store('promotions', 'public');
        }

        $promotion->update($request->only(['title', 'description', 'product_id', 'is_active', 'start_date', 'end_date']));

        return response()->json([
            'success' => true,
            'data' => $promotion->load('product'),
            'message' => 'Promotion updated successfully'
        ]);
    }

    public function destroy($id)
    {
        $promotion = Promotion::findOrFail($id);
        
        if ($promotion->image_path) {
            Storage::disk('public')->delete($promotion->image_path);
        }

        $promotion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Promotion deleted successfully'
        ]);
    }

    public function toggleActive($id)
    {
        $promotion = Promotion::findOrFail($id);
        $promotion->is_active = !$promotion->is_active;
        $promotion->save();

        return response()->json([
            'success' => true,
            'data' => $promotion,
            'message' => 'Promotion status updated'
        ]);
    }
}
