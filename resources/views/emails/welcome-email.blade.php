<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Welcome to MarketPilot</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; background: #FF5A36; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; padding: 16px !important; }
            .card-content { padding: 24px 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #FF6433 0%, #FF4D26 50%, #FF3D14 100%); background-color: #FF5328;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #FF6433 0%, #FF4D26 50%, #FF3D14 100%); background-color: #FF5328; padding: 40px 16px;">
        <tr>
            <td align="center">
                <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
                    
                    <!-- Top Logo Icon Badge -->
                    <tr>
                        <td align="center" style="padding-bottom: 20px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="background: #FF5328; border: 2px solid rgba(255, 255, 255, 0.4); width: 48px; height: 48px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); text-align: center; vertical-align: middle;">
                                        <span style="font-size: 18px; font-weight: 900; color: #ffffff; letter-spacing: 1px; line-height: 48px; display: inline-block;">MP</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main White Content Card -->
                    <tr>
                        <td style="background: #ffffff; border-radius: 16px; box-shadow: 0 12px 36px rgba(0,0,0,0.18); overflow: hidden; padding: 0;">
                            
                            <!-- Inner Top Banner -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #FF6B3D 0%, #FF5023 100%); border-top-left-radius: 16px; border-top-right-radius: 16px; text-align: center;">
                                <tr>
                                    <td align="center" style="padding: 32px 20px;">
                                        <svg width="220" height="130" viewBox="0 0 220 130" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto; max-width: 100%;">
                                            <g opacity="0.35" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3 3">
                                                <line x1="110" y1="20" x2="110" y2="8" />
                                                <line x1="150" y1="28" x2="162" y2="18" />
                                                <line x1="70" y1="28" x2="58" y2="18" />
                                            </g>
                                            <g transform="translate(75, 25)">
                                                <rect width="70" height="70" rx="16" fill="#ffffff" />
                                                <path d="M22 35L31 44L48 26" stroke="#FF5722" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                                            </g>
                                        </svg>
                                    </td>
                                </tr>
                            </table>

                            <!-- Card Body -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td class="card-content" align="center" style="padding: 36px 32px 32px 32px; text-align: center;">
                                        <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px;">
                                            Welcome to MarketPilot
                                        </h1>
                                        <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 700; color: #0284c7;">
                                            Hi {{ $user->name }}!
                                        </p>
                                        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569; max-width: 400px;">
                                            Your marketing workspace is ready. You can now generate AI promotional visuals, plan campaigns around Philippine holidays, and manage your brand assets all in one place.
                                        </p>

                                        <!-- Open Dashboard Button -->
                                        <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
                                            <tr>
                                                <td align="center" style="border-radius: 50px; background: linear-gradient(135deg, #FF6A3D 0%, #FF5722 100%); box-shadow: 0 6px 20px rgba(255, 87, 34, 0.4);">
                                                    <a href="{{ url('/dashboard') }}" target="_blank" style="display: inline-block; padding: 14px 38px; font-size: 14px; font-weight: 800; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 0.8px; border-radius: 50px;">
                                                        OPEN DASHBOARD
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding-top: 24px; text-align: center;">
                            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 500; color: rgba(255, 255, 255, 0.85);">
                                Copyright &copy; {{ date('Y') }} MarketPilot Inc. All rights reserved.
                            </p>
                            <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: rgba(255, 255, 255, 0.5); text-transform: uppercase;">
                                MarketPilot&trade;
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
