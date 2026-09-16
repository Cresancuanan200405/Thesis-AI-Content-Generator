<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$request = Request::capture();

$isVercelOrProduction = isset($_ENV['VERCEL'])
    || isset($_SERVER['VERCEL'])
    || getenv('VERCEL')
    || (isset($_ENV['APP_ENV']) && $_ENV['APP_ENV'] === 'production')
    || (isset($_SERVER['APP_ENV']) && $_SERVER['APP_ENV'] === 'production');

$isGetMethod = $request->isMethod('GET');
$isRootPath = ($request->path() === '/' || $request->path() === '');

if ($isVercelOrProduction && $isGetMethod && $isRootPath) {
    /** @var Kernel $kernel */
    $kernel = $app->make(Kernel::class);

    try {
        $response = $kernel->handle($request);

        if (isset($response->exception) && $response->exception instanceof Throwable) {
            throw $response->exception;
        }

        $response->send();
        $kernel->terminate($request, $response);
    } catch (Throwable $e) {
        try {
            $correlationId = (string) Str::uuid();

            $sqlState = null;
            if ($e instanceof PDOException || property_exists($e, 'errorInfo')) {
                $errorInfo = property_exists($e, 'errorInfo') ? $e->errorInfo : null;
                if (is_array($errorInfo) && isset($errorInfo[0]) && is_string($errorInfo[0])) {
                    $sqlState = $errorInfo[0];
                } elseif (is_string($e->getCode()) && strlen($e->getCode()) === 5) {
                    $sqlState = $e->getCode();
                }
            }

            $sanitizedMessage = preg_replace('/(password|pwd|secret|key|token)=([^&;\s]+)/i', '$1=[REDACTED]', $e->getMessage());
            $sanitizedMessage = substr((string) $sanitizedMessage, 0, 500);

            $basePath = $app->basePath();
            $trace = [];
            foreach (array_slice($e->getTrace(), 0, 10) as $frame) {
                $file = isset($frame['file']) ? str_replace([$basePath, '\\'], ['', '/'], $frame['file']) : '[internal]';
                $call = ($frame['class'] ?? '').($frame['type'] ?? '').($frame['function'] ?? '');
                $trace[] = [
                    'file' => $file,
                    'line' => $frame['line'] ?? 0,
                    'call' => $call,
                ];
            }

            $diagnostic = [
                'tag' => 'MARKETPILOT_HTTP_BOUNDARY_DIAGNOSTIC',
                'correlation_id' => $correlationId,
                'method' => 'GET',
                'path' => '/',
                'exception_class' => get_class($e),
                'exception_message' => $sanitizedMessage,
                'sqlstate' => $sqlState,
                'exception_file' => str_replace([$basePath, '\\'], ['', '/'], $e->getFile()),
                'exception_line' => $e->getLine(),
                'trace' => $trace,
            ];

            @file_put_contents('php://stderr', json_encode($diagnostic, JSON_UNESCAPED_SLASHES)."\n");
        } catch (Throwable) {
            //
        }

        throw $e;
    }
} else {
    $app->handleRequest($request);
}
