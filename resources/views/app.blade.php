<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Inline script to detect appearance and apply dark class immediately --}}
        <script>
            (function() {
                try {
                    const pathname = window.location.pathname;
                    const isPublicOrAuth = pathname === '/' ||
                        pathname.startsWith('/login') ||
                        pathname.startsWith('/register') ||
                        pathname.startsWith('/forgot-password') ||
                        pathname.startsWith('/reset-password') ||
                        pathname.startsWith('/verify-email') ||
                        pathname.startsWith('/two-factor-challenge');
                    const stored = isPublicOrAuth ? 'system' : (localStorage.getItem('appearance') || '{{ $appearance ?? "system" }}');
                    const isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    if (isDark) {
                        document.documentElement.classList.add('dark');
                        document.documentElement.style.colorScheme = 'dark';
                    } else {
                        document.documentElement.classList.remove('dark');
                        document.documentElement.style.colorScheme = 'light';
                    }
                } catch (e) {}
            })();
        </script>

        {{-- Inline style to set the HTML background color matching app.css --}}
        <style>
            html {
                background-color: #f4f4f5;
            }

            html.dark {
                background-color: #09090b;
            }
        </style>

        <link rel="icon" type="image/png" href="/MarketPilot.png">
        <link rel="shortcut icon" type="image/png" href="/MarketPilot.png">
        <link rel="apple-touch-icon" href="/MarketPilot.png">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
