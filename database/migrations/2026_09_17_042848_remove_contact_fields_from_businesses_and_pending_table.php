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
        Schema::table('businesses', function (Blueprint $table) {
            $columnsToDrop = array_filter(
                ['business_contact_number', 'business_email', 'website_social_page'],
                fn (string $column) => Schema::hasColumn('businesses', $column)
            );

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });

        Schema::table('pending_onboardings', function (Blueprint $table) {
            $columnsToDrop = array_filter(
                ['business_contact_number', 'business_email', 'website_social_page'],
                fn (string $column) => Schema::hasColumn('pending_onboardings', $column)
            );

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('business_contact_number')->nullable()->after('region');
            $table->string('business_email')->nullable()->after('business_contact_number');
            $table->string('website_social_page')->nullable()->after('business_email');
        });

        Schema::table('pending_onboardings', function (Blueprint $table) {
            $table->string('business_contact_number', 30)->nullable();
            $table->string('business_email')->nullable();
            $table->string('website_social_page')->nullable();
        });
    }
};
