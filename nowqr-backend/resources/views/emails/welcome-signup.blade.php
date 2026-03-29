<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{ $appName }}</title>
</head>
<body style="margin:0; padding:0; background:#f1f5f9; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;">
                <tr>
                    <td style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding:20px 24px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                <td style="width:44px;" valign="middle">
                                    <div style="width:40px; height:40px; border-radius:12px; background:#f97316; color:#ffffff; font-size:20px; line-height:40px; text-align:center; font-weight:700;">Q</div>
                                </td>
                                <td valign="middle" style="color:#ffffff; font-size:22px; font-weight:700; letter-spacing:0.2px;">NowQR</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding:28px 24px 8px;">
                        <div style="display:inline-block; padding:6px 12px; background:#fff7ed; color:#c2410c; border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.6px;">Welcome Aboard</div>
                        <h1 style="margin:14px 0 8px; font-size:28px; line-height:1.2; color:#0f172a;">Hi {{ $user->first_name }}, your {{ $appName }} account is ready.</h1>
                        <p style="margin:0; color:#475569; font-size:15px; line-height:1.7;">You can now create campaigns, design flyers, and track scans. We have already added your signup bonus credits so you can start immediately.</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:18px 24px 8px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
                            <tr>
                                <td style="padding:14px 16px; color:#334155; font-size:14px; line-height:1.6;">
                                    Verify your email from the verification email we sent to <strong>{{ $user->email }}</strong> to unlock all protected actions.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding:20px 24px 28px;">
                        <a href="{{ $frontendUrl }}/login" style="display:inline-block; background:#f97316; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:10px; font-weight:700; font-size:14px;">Go To Dashboard</a>
                        <p style="margin:16px 0 0; color:#64748b; font-size:13px;">If you did not create this account, please ignore this email or contact us at {{ $supportEmail }}.</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:14px 24px; background:#f8fafc; color:#64748b; font-size:12px; text-align:center; border-top:1px solid #e2e8f0;">&copy; {{ $year }} {{ $appName }}. All rights reserved.</td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
