<?php
/**
 * fetch_products.php
 * Unified product and promotion API bridge for simplified integration.
 */
header('Content-Type: application/json');

// Include composer to use Dotenv if needed, or simply handle it via standard PHP
// For Bluehost/Production, we should read environment variables
// This script provides a bridge between Laravel's DB and the requested simplified JSON format.

require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Load environment variables from the parent directory
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
try {
    $dotenv->load();
} catch (Exception $e) {
    // Fail silently if .env is missing (e.g. in some production setups)
}

$db_host = $_ENV['DB_HOST'] ?? 'localhost';
$db_user = $_ENV['DB_USERNAME'] ?? 'root';
$db_pass = $_ENV['DB_PASSWORD'] ?? '';
$db_name = $_ENV['DB_DATABASE'] ?? 'ims_db';

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Connection failed: ' . $conn->connect_error
    ]));
}

// Fetching products and appending the full image URL
$sql = "SELECT product_id as p_id, name as p_name, image_path as p_image, is_promotion, selling_price, discount_price FROM products WHERE is_active = 1";
$result = $conn->query($sql);

$output = array();
$base_url = $_ENV['APP_URL'] ?? 'http://localhost:8000';

while($row = $result->fetch_assoc()) {
    // If you need a specific IP for local testing, replace $base_url with 'http://192.168.x.x'
    // We dynamically generate the full URL pointing to Laravel's storage
    $row['image_url'] = $row['p_image'] ? $base_url . "/storage/" . $row['p_image'] : null;
    
    // Type casting for numeric values
    $row['p_id'] = (int)$row['p_id'];
    $row['is_promotion'] = (int)$row['is_promotion'];
    $row['selling_price'] = (float)$row['selling_price'];
    $row['discount_price'] = $row['discount_price'] ? (float)$row['discount_price'] : null;
    
    $output[] = $row;
}

echo json_encode($output);

$conn->close();
?>
