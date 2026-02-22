<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'username' => 'admin',
            'password_hash' => \Illuminate\Support\Facades\Hash::make('admin123'),
            'full_name' => 'Admin Somali POS',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->call([
            ProductSeeder::class,
            CustomerSeeder::class,
        ]);
    }
}
