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
            $table->text('target_audience')->nullable()->after('description');
            $table->text('unique_selling_point')->nullable()->after('target_audience');
            $table->json('content_style')->nullable()->after('unique_selling_point');
            $table->string('default_tagline_behavior')->nullable()->after('content_style');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn([
                'target_audience',
                'unique_selling_point',
                'content_style',
                'default_tagline_behavior',
            ]);
        });
    }
};
