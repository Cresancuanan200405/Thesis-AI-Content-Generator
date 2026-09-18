<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Verify your new email address — MarketPilot</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; background: #FF5A36; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; padding: 16px !important; }
            .card-content { padding: 24px 20px !important; }
            .code-box { font-size: 26px !important; letter-spacing: 4px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #FF6433 0%, #FF4D26 50%, #FF3D14 100%); background-color: #FF5328;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #FF6433 0%, #FF4D26 50%, #FF3D14 100%); background-color: #FF5328; padding: 40px 16px;">
        <tr>
            <td align="center">
                <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
                    
                    <!-- Logo Icon Badge -->
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

                    <!-- Main Content Card -->
                    <tr>
                        <td style="background: #ffffff; border-radius: 16px; box-shadow: 0 12px 36px rgba(0,0,0,0.18); overflow: hidden; padding: 0;">
                            
                            <!-- Header Banner -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); border-top-left-radius: 16px; border-top-right-radius: 16px; text-align: center;">
                                <tr>
                                    <td align="center" style="padding: 28px 20px;">
                                        <div style="display: inline-block; width: 48px; height: 48px; border-radius: 50%; background: rgba(255, 255, 255, 0.2); line-height: 48px; text-align: center; font-size: 24px;">
                                            🔒
                                        </div>
                                        <h2 style="margin: 12px 0 0 0; color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: -0.3px;">
                                            Security Confirmation
                                        </h2>
                                    </td>
                                </tr>
                            </table>

                            <!-- Card Body Content -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td class="card-content" align="center" style="padding: 36px 32px 32px 32px; text-align: center;">
                                        
                                        <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px;">
                                            Confirm your new email address
                                        </h1>

                                        <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #0284c7;">
                                            MarketPilot Account Security
                                        </p>

                                        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569; max-width: 420px;">
                                            A request was recently submitted to update the primary email address for your MarketPilot account to:
                                        </p>

                                        <div style="background: #f1f5f9; border-radius: 8px; padding: 10px 16px; margin: 0 0 24px 0; display: inline-block;">
                                            <span style="font-size: 14px; font-weight: 700; color: #0f172a; word-break: break-all;">
                                                {{ $newEmail }}
                                            </span>
                                        </div>

                                        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569; max-width: 420px;">
                                            To complete this email change, please enter the following 6-digit verification code into the MarketPilot settings window:
                                        </p>

                                        <!-- 6-Digit Code Highlight Box -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 24px 0;">
                                            <tr>
                                                <td align="center">
                                                    <div style="display: inline-block; background: #f8fafc; border: 2px dashed #0284c7; border-radius: 12px; padding: 14px 28px; text-align: center;">
                                                        <span class="code-box" style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0284c7; display: block;">
                                                            {{ $code }}
                                                        </span>
                                                        <span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-top: 4px;">
                                                            Expires in 15 minutes
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Security Disclaimer Note -->
                                        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: left;">
                                            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #334155;">
                                                Important Security Information:
                                            </p>
                                            <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6; color: #64748b;">
                                                <li>Your current email address remains active and unchanged until this code is verified.</li>
                                                <li>This code is single-use and will expire in 15 minutes.</li>
                                                <li>If you did not request this email change, please ignore this email and verify your account password immediately.</li>
                                            </ul>
                                        </div>

                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Below Card Footer -->
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
