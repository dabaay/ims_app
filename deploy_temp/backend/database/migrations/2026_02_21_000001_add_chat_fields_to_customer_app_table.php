<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('customerApp', function (Blueprint $table) {
            $table->string('chat_status')->default('open')->after('current_balance'); // open, closed
            $table->boolean('needs_rating')->default(false)->after('chat_status');
            $table->boolean('last_rating')->nullable()->after('needs_rating'); // 1 for like, 0 for unlike
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customerApp', function (Blueprint $table) {
            $table->dropColumn(['chat_status', 'needs_rating', 'last_rating']);
        });
    }
};
