<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\SaleItem;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $customerId = $request->user('customer')->customer_id;

        // Trending products (most sold in last 30 days)
        $trendingIds = SaleItem::select('sale_items.product_id', DB::raw('SUM(sale_items.quantity) as total_sold'))
            ->join('sales', 'sales.sale_id', '=', 'sale_items.sale_id')
            ->where('sales.sale_date', '>=', now()->subDays(30))
            ->whereNotNull('sale_items.product_id')
            ->groupBy('sale_items.product_id')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->pluck('sale_items.product_id')
            ->toArray();

        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Product> $trendingProducts */
        $trendingProducts = Product::with(['favorites', 'ratings'])
            ->whereIn('product_id', $trendingIds)
            ->where('is_active', true)
            ->get();

        foreach ($trendingProducts as $product) {
            /** @var \App\Models\Product $product */
            $product->is_favorite    = $product->favorites->where('customer_id', $customerId)->isNotEmpty();
            $product->average_rating = round((float) $product->ratings->avg('rating'), 1);
            unset($product->favorites, $product->ratings);
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Product> $newProducts */
        $newProducts = Product::with(['favorites', 'ratings'])
            ->where('is_active', true)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        foreach ($newProducts as $product) {
            /** @var \App\Models\Product $product */
            $product->is_favorite    = $product->favorites->where('customer_id', $customerId)->isNotEmpty();
            $product->average_rating = round((float) $product->ratings->avg('rating'), 1);
            unset($product->favorites, $product->ratings);
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Promotion> $promotions */
        $promotions = Promotion::where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('start_date')
                    ->orWhere('start_date', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            })
            ->latest()
            ->get();

        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Product> $discountedProducts */
        $discountedProducts = Product::with(['favorites', 'ratings'])
            ->where('is_active', true)
            ->where('discount_price', '>', 0)
            ->where(function ($query) {
                $query->whereNull('discount_start_date')
                    ->orWhere('discount_start_date', '<=', now());
            })
            ->where(function ($query) {
                $query->whereNull('discount_end_date')
                    ->orWhere('discount_end_date', '>=', now());
            })
            ->limit(10)
            ->get();

        foreach ($discountedProducts as $product) {
            /** @var \App\Models\Product $product */
            $product->is_favorite    = $product->favorites->where('customer_id', $customerId)->isNotEmpty();
            $product->average_rating = round((float) $product->ratings->avg('rating'), 1);
            unset($product->favorites, $product->ratings);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'promotions'         => $promotions,
                'trending_products'  => $trendingProducts,
                'new_products'       => $newProducts,
                'discounted_products' => $discountedProducts,
            ],
        ]);
    }
}
