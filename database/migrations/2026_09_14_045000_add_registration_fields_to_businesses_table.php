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
            $table->string('main_business_activity')->nullable()->after('description');
            $table->string('business_address')->nullable()->after('main_business_activity');
            $table->string('barangay')->nullable()->after('business_address');
            $table->string('city_municipality')->nullable()->after('barangay');
            $table->string('province')->nullable()->after('city_municipality');
            $table->string('region')->nullable()->after('province');
            $table->string('business_contact_number')->nullable()->after('region');
            $table->string('business_email')->nullable()->after('business_contact_number');
            $table->string('website_social_page')->nullable()->after('business_email');
            $table->string('registration_type')->nullable()->after('website_social_page');
            $table->string('registration_number')->nullable()->after('registration_type');
            $table->string('business_permit_number')->nullable()->after('registration_number');
            $table->date('registration_permit_date')->nullable()->after('business_permit_number');
            $table->string('business_registration_document_path')->nullable()->after('registration_permit_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn([
                'main_business_activity',
                'business_address',
                'barangay',
                'city_municipality',
                'province',
                'region',
                'business_contact_number',
                'business_email',
                'website_social_page',
                'registration_type',
                'registration_number',
                'business_permit_number',
                'registration_permit_date',
                'business_registration_document_path',
            ]);
        });
    }
};
