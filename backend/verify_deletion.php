<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

try {
    DB::beginTransaction();

    // 1. Create a dummy user for 'created_by'
    $user = User::first() ?: User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
        'role' => 'admin'
    ]);

    // 2. Create a test product
    $product = Product::create([
        'product_code' => 'TEST-' . uniqid(),
        'name' => 'Test Deletable Product',
        'category' => 'Test',
        'cost_price' => 10.00,
        'selling_price' => 20.00,
        'current_stock' => 100,
        'unit' => 'piece',
        'is_active' => true,
        'created_by' => $user->user_id
    ]);
    echo "Product created: {$product->name} (ID: {$product->product_id})\n";

    // 3. Record a sale for this product
    $sale = Sale::create([
        'invoice_number' => 'TEST-INV-' . uniqid(),
        'cashier_id' => $user->user_id,
        'sale_date' => now(),
        'subtotal' => 20.00,
        'total_amount' => 20.00,
        'amount_paid' => 20.00,
        'balance_due' => 0,
        'payment_method' => 'cash',
        'payment_status' => 'paid'
    ]);

    $saleItem = SaleItem::create([
        'sale_id' => $sale->sale_id,
        'product_id' => $product->product_id,
        'product_name' => $product->name,
        'quantity' => 1,
        'unit_price' => 20.00,
        'subtotal' => 20.00,
        'cost_price' => 10.00
    ]);
    echo "Sale recorded for product. SaleItem stored product_name: {$saleItem->product_name}\n";

    // 4. Attempt to delete the product
    echo "Attempting to delete product...\n";
    $product->delete();
    
    if (!Product::find($product->product_id)) {
        echo "SUCCESS: Product was deleted from database.\n";
    } else {
        throw new Exception("FAILURE: Product still exists in database.");
    }

    // 5. Verify sale item still exists and has the product_name
    $saleItem->refresh();
    if ($saleItem->product_id === null && $saleItem->product_name === 'Test Deletable Product') {
        echo "SUCCESS: SaleItem preserved product_name and set product_id to NULL.\n";
    } else {
        throw new Exception("FAILURE: SaleItem was corrupted. ProductID: " . ($saleItem->product_id ?? 'NULL') . ", Name: {$saleItem->product_name}");
    }

    DB::rollBack();
    echo "\nVerification complete! All tests passed.\n";

} catch (Exception $e) {
    DB::rollBack();
    echo "\nERROR: " . $e->getMessage() . "\n";
    exit(1);
}
