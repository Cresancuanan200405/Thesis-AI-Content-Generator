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
        Schema::create('pending_onboardings', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique();
            $table->string('registration_type', 32)->default('normal');
            $table->string('email')->index();
            $table->string('username')->nullable()->index();
            $table->string('password_hash')->nullable();
            $table->string('provider_name')->nullable();
            $table->string('provider_id')->nullable()->index();
            $table->text('avatar')->nullable();

            // Email verification
            $table->string('email_verification_code', 6)->nullable();
            $table->timestamp('email_verification_expires_at')->nullable();
            $table->timestamp('email_verified_at')->nullable();

            // Step 1: Personal Information
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('suffix', 20)->nullable();
            $table->string('mobile_number', 30)->nullable();

            // Step 2: Business Information
            $table->string('business_name')->nullable();
            $table->string('industry')->nullable();
            $table->string('category')->nullable();

            // Step 3: About & Registration Information
            $table->text('business_description')->nullable();
            $table->string('business_address')->nullable();
            $table->string('barangay')->nullable();
            $table->string('city_municipality')->nullable();
            $table->string('province')->nullable();
            $table->string('region')->nullable();
            $table->string('business_contact_number', 30)->nullable();
            $table->string('business_email')->nullable();
            $table->string('website_social_page')->nullable();
            $table->string('registration_type_field')->nullable();
            $table->string('registration_number')->nullable();
            $table->string('business_permit_number')->nullable();
            $table->date('registration_permit_date')->nullable();
            $table->string('business_registration_document_path')->nullable();

            // Legal Documents
            $table->json('accepted_legal_documents')->nullable();

            // Status & lifecycle
            $table->unsignedTinyInteger('current_step')->default(1);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pending_onboardings');
    }
};
