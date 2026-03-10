<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add product_name to sale_items to preserve history after product deletion
        Schema::table('sale_items', function (Blueprint $table) {
            $table->string('product_name', 255)->after('product_id')->nullable();
        });

        // 2. Populate product_name for existing sale_items
        DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.product_id')
            ->update(['sale_items.product_name' => DB::raw('products.name')]);

        // 3. Update foreign key constraints to onDelete('set null')
        
        // Sale Items
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->unsignedBigInteger('product_id')->nullable()->change();
            $table->foreign('product_id')
                ->references('product_id')
                ->on('products')
                ->onDelete('set null');
        });

        // Purchase Items
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->unsignedBigInteger('product_id')->nullable()->change();
            $table->foreign('product_id')
                ->references('product_id')
                ->on('products')
                ->onDelete('set null');
        });

        // Customer Favorites
        if (Schema::hasTable('customer_favorites')) {
            Schema::table('customer_favorites', function (Blueprint $table) {
                $table->dropForeign(['product_id']);
                $table->unsignedBigInteger('product_id')->nullable()->change();
                $table->foreign('product_id')
                    ->references('product_id')
                    ->on('products')
                    ->onDelete('set null');
            });
        }

        // Product Ratings
        if (Schema::hasTable('product_ratings')) {
            Schema::table('product_ratings', function (Blueprint $table) {
                $table->dropForeign(['product_id']);
                $table->unsignedBigInteger('product_id')->nullable()->change();
                $table->foreign('product_id')
                    ->references('product_id')
                    ->on('products')
                    ->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn('product_name');
            // Note: Restoring FKs to original state would require knowing if they were NULL before, 
            // but usually they were required.
        });
    }
};
