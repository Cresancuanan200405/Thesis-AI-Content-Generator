<?php

use App\Http\Middleware\EnsureOnboardingCompleted;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->alias([
            'onboarding.complete' => EnsureOnboardingCompleted::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->report(function (Throwable $e): void {
            try {
                $isVercelOrProduction = isset($_ENV['VERCEL'])
                    || isset($_SERVER['VERCEL'])
                    || getenv('VERCEL')
                    || app()->environment('production');

                if (! $isVercelOrProduction) {
                    return;
                }

                $request = app()->has('request') ? app('request') : null;
                $method = $request instanceof Request
                    ? $request->method()
                    : ($_SERVER['REQUEST_METHOD'] ?? '');
                $path = $request instanceof Request
                    ? $request->path()
                    : (parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '');

                if (strtoupper($method) !== 'GET' || ($path !== '/' && $path !== '')) {
                    return;
                }

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

                $basePath = base_path();
                $trace = [];
                $trace[] = [
                    'file' => str_replace([$basePath, '\\'], ['', '/'], $e->getFile()),
                    'line' => $e->getLine(),
                    'call' => 'throw',
                ];

                foreach (array_slice($e->getTrace(), 0, 8) as $frame) {
                    $file = isset($frame['file']) ? str_replace([$basePath, '\\'], ['', '/'], $frame['file']) : '[internal]';
                    $call = ($frame['class'] ?? '').($frame['type'] ?? '').($frame['function'] ?? '');
                    $trace[] = [
                        'file' => $file,
                        'line' => $frame['line'] ?? 0,
                        'call' => $call,
                    ];
                }

                $diagnostic = [
                    'tag' => 'MARKETPILOT_DIAGNOSTIC',
                    'correlation_id' => $correlationId,
                    'method' => 'GET',
                    'path' => '/',
                    'exception_class' => get_class($e),
                    'exception_message' => $sanitizedMessage,
                    'sqlstate' => $sqlState,
                    'trace' => $trace,
                ];

                @file_put_contents('php://stderr', json_encode($diagnostic, JSON_UNESCAPED_SLASHES)."\n");
            } catch (Throwable) {
                //
            }
        });
    })->create();

if (isset($_ENV['VERCEL']) || isset($_SERVER['VERCEL']) || getenv('VERCEL')) {
    $app->useStoragePath('/tmp/storage');
}

return $app;
