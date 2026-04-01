<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your email</title>
</head>

<body style="margin:0; padding:0; background:#f1f5f9; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                    style="max-width:640px; background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;">
                    <tr>
                        <td style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding:20px 24px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td valign="middle" style="color:#ffffff; font-size:22px; font-weight:700;">NowQR
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px 24px 8px;">
                            <div
                                style="display:inline-block; padding:6px 12px; background:#fff7ed; color:#c2410c; border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase;">
                                Verify Email</div>
                            <h1 style="margin:14px 0 8px; font-size:28px; line-height:1.2; color:#0f172a;">Hi
                                {{ $name }}, confirm your email address.</h1>
                            <p style="margin:0; color:#475569; font-size:15px; line-height:1.7;">Please verify
                                <strong>{{ $email }}</strong> to secure your account and access all
                                {{ $appName }} features.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 24px 8px;">
                            <a href="{{ $verifyUrl }}"
                                style="display:inline-block; background:#f97316; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:10px; font-weight:700; font-size:14px;">Verify
                                Email</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:12px 24px 28px; color:#64748b; font-size:13px; line-height:1.6;">
                            If you did not create this account, you can safely ignore this email.
                        </td>
                    </tr>
                    <tr>
                        <td
                            style="padding:14px 24px; background:#f8fafc; color:#64748b; font-size:12px; text-align:center; border-top:1px solid #e2e8f0;">
                            Need help? {{ $supportEmail }} • &copy; {{ $year }} {{ $appName }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
