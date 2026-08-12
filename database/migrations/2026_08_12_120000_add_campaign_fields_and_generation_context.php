<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->foreignId('product_id')->nullable()->after('business_id')->constrained()->nullOnDelete();
            $table->text('objective')->nullable()->after('description');
            $table->string('target_audience')->nullable()->after('objective');
        });

        Schema::table('generation_requests', function (Blueprint $table) {
            $table->foreignId('campaign_id')->nullable()->after('business_id')->constrained()->nullOnDelete();
            $table->index('campaign_id');
        });
    }

    public function down(): void
    {
        Schema::table('generation_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('campaign_id');
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropConstrainedForeignId('product_id');
            $table->dropColumn(['objective', 'target_audience']);
        });
    }
};
