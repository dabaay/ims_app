<?php

namespace Database\Seeders;

use App\Models\CustomerApp;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        CustomerApp::updateOrCreate(
            ['username' => 'testuser'],
            [
                'full_name' => 'Test Customer',
                'phone' => '252611111111',
                'address' => 'Mogadishu, Somalia',
                'password' => Hash::make('password123'),
                'status' => 'active',
                'registration_date' => now(),
                'current_balance' => 0.00,
            ]
        );
    }
}
