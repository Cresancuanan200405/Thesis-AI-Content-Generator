<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('generation_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('event_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->string('marketing_goal');
            $table->json('content_style')->nullable();
            $table->json('brand_tone')->nullable();
            $table->string('tagline')->nullable();
            $table->string('tagline_mode')->default('auto');
            $table->string('target_audience')->nullable();
            $table->text('unique_selling_point')->nullable();
            $table->string('reference_image_path')->nullable();
            $table->text('notes')->nullable();
            $table->longText('prompt');
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->index('user_id');
            $table->index('business_id');
            $table->index('product_id');
            $table->index('event_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generation_requests');
    }
};
