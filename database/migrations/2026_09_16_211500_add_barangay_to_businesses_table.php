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
        if (! Schema::hasColumn('businesses', 'barangay')) {
            Schema::table('businesses', function (Blueprint $table) {
                $table->string('barangay')->nullable()->after('business_address');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('businesses', 'barangay')) {
            Schema::table('businesses', function (Blueprint $table) {
                $table->dropColumn('barangay');
            });
        }
    }
};
