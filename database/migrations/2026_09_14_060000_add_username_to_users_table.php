<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->after('name')->unique();
            }
        });

        $users = DB::table('users')->where(function ($query) {
            $query->whereNull('username')->orWhere('username', '');
        })->get();

        foreach ($users as $user) {
            $base = $this->buildUsernameCandidate((string) ($user->email ?? ''), (string) ($user->name ?? ''));
            $username = $base;
            $suffix = 1;

            while (DB::table('users')->where('username', $username)->where('id', '!=', $user->id)->exists()) {
                $username = $base.'_'.$suffix;
                $suffix++;
            }

            DB::table('users')->where('id', $user->id)->update([
                'username' => $username,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }

    protected function buildUsernameCandidate(string $email, string $name): string
    {
        $emailLocal = Str::before($email, '@');
        $candidate = preg_replace('/[^A-Za-z0-9._-]+/', '', $emailLocal ?: $name) ?: 'user';
        $candidate = strtolower(trim($candidate));

        if ($candidate === '') {
            $candidate = 'user';
        }

        return $candidate;
    }
};
