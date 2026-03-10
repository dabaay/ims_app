<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Skipped — start_date and end_date are already defined in the create_promotions_table migration.
     */
    public function up(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            if (!Schema::hasColumn('promotions', 'start_date')) {
                $table->dateTime('start_date')->nullable()->after('is_active');
            }
            if (!Schema::hasColumn('promotions', 'end_date')) {
                $table->dateTime('end_date')->nullable()->after('start_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Columns are managed by create_promotions_table — nothing to roll back here.
    }
};
