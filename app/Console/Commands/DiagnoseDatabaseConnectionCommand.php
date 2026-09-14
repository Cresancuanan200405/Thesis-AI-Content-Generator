<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

#[Signature('db:diagnose')]
#[Description('Display the active database user, database name, and server version')]
class DiagnoseDatabaseConnectionCommand extends Command
{
    public function handle(): int
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            $this->error('Database diagnostic requires the active connection to use PostgreSQL.');

            return self::FAILURE;
        }

        try {
            $result = DB::select("\n                select\n                    current_user,\n                    current_database(),\n                    current_setting('server_version')\n            ");
        } catch (Throwable $exception) {
            $this->error('Database diagnostic failed: '.$exception->getMessage());

            return self::FAILURE;
        }

        $diagnostic = (array) ($result[0] ?? []);

        $this->table(
            ['Database User', 'Database Name', 'Server Version'],
            [[
                $diagnostic['current_user'] ?? 'unknown',
                $diagnostic['current_database'] ?? 'unknown',
                $diagnostic['current_setting'] ?? 'unknown',
            ]],
        );

        return self::SUCCESS;
    }
}
