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
        Schema::create('legal_acceptances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('document_type', 64);
            $table->string('document_version', 32)->default('v1.0');
            $table->timestamp('accepted_at');
            $table->timestamps();

            $table->unique(['user_id', 'document_type', 'document_version'], 'legal_acceptances_user_doc_ver_unique');
            $table->index(['user_id', 'document_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legal_acceptances');
    }
};
