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
        $users = [
            [
                'username' => 'admin',
                'password_hash' => '$2y$12$yZg5tPEw8jUL8YabeNNDQuqV1QlvKFLE3Hnzo/swe4yrE4hQenMt.',
                'full_name' => 'Admin Somali POS',
                'email' => null,
                'phone' => null,
                'role' => 'admin',
                'is_enabled' => true,
                'is_online' => false,
                'plain_password' => null,
            ],
            [
                'username' => 'maanka',
                'password_hash' => '$2y$12$rhMLuBlShTju6LZhf0Os8ORsFtl6vbx53g5wg52IOdywpfr4Ar0TC',
                'full_name' => 'maanka abdulkadir',
                'email' => 'maanka@gmail.com',
                'phone' => '683632095',
                'role' => 'cashier',
                'permissions' => [
                    'modules' => [
                        'pos' => true,
                        'customers' => true,
                        'sales_history' => true,
                        'expenses' => true,
                        'walpo' => true,
                        'reports' => true,
                    ],
                    'actions' => [
                        'record' => true,
                        'edit' => true,
                    ],
                ],
                'is_enabled' => true,
                'is_online' => true,
                'plain_password' => 'maanka1',
            ],
            [
                'username' => 'dabaay',
                'password_hash' => '$2y$12$P.zuYfizfebH4pTJWDLtbeOEwf7FLZPqL77n1vkYchPjI.7VzYnQK',
                'full_name' => 'Abdirahman Abdulkadir',
                'email' => null,
                'phone' => null,
                'role' => 'admin',
                'is_enabled' => true,
                'is_online' => true,
                'plain_password' => 'dabaay12',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['username' => $userData['username']],
                $userData
            );
        }
    }
}
