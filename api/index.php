<?php

ini_set('display_errors', '1');
error_reporting(E_ALL);

register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        header('Content-Type: text/plain');
        echo 'FATAL ERROR: '.$err['message'].' in '.$err['file'].' on line '.$err['line']."\n";
    }
});

// Prepare writable storage directories in /tmp for Vercel Serverless environment
$storageDirs = [
    '/tmp/storage',
    '/tmp/storage/app',
    '/tmp/storage/app/public',
    '/tmp/storage/framework',
    '/tmp/storage/framework/cache',
    '/tmp/storage/framework/cache/data',
    '/tmp/storage/framework/sessions',
    '/tmp/storage/framework/views',
    '/tmp/storage/logs',
    '/tmp/views',
];

putenv('APP_STORAGE=/tmp/storage');
$_ENV['APP_STORAGE'] = '/tmp/storage';
$_SERVER['APP_STORAGE'] = '/tmp/storage';

if (empty($_ENV['APP_MAINTENANCE_DRIVER'])) {
    putenv('APP_MAINTENANCE_DRIVER=file');
    $_ENV['APP_MAINTENANCE_DRIVER'] = 'file';
    $_SERVER['APP_MAINTENANCE_DRIVER'] = 'file';
}

if ((isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
    || (isset($_SERVER['HTTP_X_FORWARDED_SSL']) && $_SERVER['HTTP_X_FORWARDED_SSL'] === 'on')
    || (isset($_SERVER['HTTP_X_FORWARDED_PORT']) && $_SERVER['HTTP_X_FORWARDED_PORT'] === '443')
    || (isset($_ENV['APP_ENV']) && $_ENV['APP_ENV'] === 'production')
    || (isset($_SERVER['APP_ENV']) && $_SERVER['APP_ENV'] === 'production')
) {
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SERVER_PORT'] = '443';
}

foreach ($storageDirs as $dir) {
    if (! is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

if (! file_exists('/tmp/storage/logs/laravel.log')) {
    @touch('/tmp/storage/logs/laravel.log');
}

try {
    require __DIR__.'/../public/index.php';
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: text/plain');
    echo 'UNCAUGHT EXCEPTION: '.$e->getMessage().' in '.$e->getFile().':'.$e->getLine()."\n".$e->getTraceAsString();
}
