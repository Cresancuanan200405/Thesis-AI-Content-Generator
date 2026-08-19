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
        Schema::table('events', function (Blueprint $table) {
            $table->string('category')->nullable()->after('type');
            $table->boolean('is_long_weekend')->default(false)->after('category');
            $table->string('long_weekend_details')->nullable()->after('is_long_weekend');
            $table->date('shifted_from_date')->nullable()->after('long_weekend_details');
            $table->string('proclamation_no')->nullable()->after('shifted_from_date');

            $table->index('category');
            $table->index('is_long_weekend');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropIndex(['is_long_weekend']);
            $table->dropColumn([
                'category',
                'is_long_weekend',
                'long_weekend_details',
                'shifted_from_date',
                'proclamation_no',
            ]);
        });
    }
};
