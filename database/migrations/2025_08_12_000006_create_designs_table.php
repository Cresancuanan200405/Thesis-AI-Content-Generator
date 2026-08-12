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
        Schema::create('designs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('event_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->text('prompt');
            $table->decimal('price', 10, 2)->nullable();
            $table->string('brand_tone')->nullable();
            $table->string('visual_theme')->nullable();
            $table->string('tagline')->nullable();
            $table->string('tagline_mode')->nullable();
            $table->string('reference_image_path')->nullable();
            $table->string('generated_image_path')->nullable();
            $table->json('generation_metadata')->nullable();
            $table->string('status')->default('pending');
            $table->boolean('is_favorite')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('business_id');
            $table->index('campaign_id');
            $table->index('event_id');
            $table->index('product_id');
            $table->index('status');
            $table->index('is_favorite');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('designs');
    }
};
