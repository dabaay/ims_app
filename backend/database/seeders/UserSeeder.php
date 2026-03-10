<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['username' => 'demo_admin'],
            [
                'full_name'     => 'Demo Administrator',
                'email'         => 'demo@somalipos.com',
                'phone'         => null,
                'role'          => 'admin',
                'password_hash' => Hash::make('demo_password'),
                'is_enabled'    => true,
                'is_online'     => false,
                'plain_password'=> 'demo_password',
            ]
        );
    }
}
