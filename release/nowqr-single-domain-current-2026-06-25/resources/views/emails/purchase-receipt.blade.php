<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $appName }} Receipt</title>
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
                                    <td valign="middle"
                                        style="color:#ffffff; font-size:22px; font-weight:700; letter-spacing:0.2px;">
                                        NowQR</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px 24px 8px;">
                            <div
                                style="display:inline-block; padding:6px 12px; background:#ecfdf5; color:#047857; border-radius:999px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.6px;">
                                Payment Confirmed</div>
                            <h1 style="margin:14px 0 8px; font-size:28px; line-height:1.2; color:#0f172a;">Thanks
                                {{ $user->first_name }}, your credits are now available.</h1>
                            <p style="margin:0; color:#475569; font-size:15px; line-height:1.7;">Here is your receipt
                                summary for this {{ $appName }} transaction.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:18px 24px 8px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                style="margin:0; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
                                <tr>
                                    <td
                                        style="padding:12px 14px; background:#f8fafc; width:45%; font-weight:600; color:#334155;">
                                        Item</td>
                                    <td style="padding:12px 14px;">{{ $receiptTitle }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 14px; background:#f8fafc; font-weight:600; color:#334155;">
                                        Credits Added</td>
                                    <td style="padding:12px 14px;">{{ $credits }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 14px; background:#f8fafc; font-weight:600; color:#334155;">
                                        Amount Paid</td>
                                    <td style="padding:12px 14px;">{{ number_format($amount, 2) }}
                                        {{ strtoupper($currency) }}</td>
                                </tr>
                                @if ($paymentId)
                                    <tr>
                                        <td
                                            style="padding:12px 14px; background:#f8fafc; font-weight:600; color:#334155;">
                                            Payment ID</td>
                                        <td style="padding:12px 14px; word-break:break-all;">{{ $paymentId }}</td>
                                    </tr>
                                @endif
                                <tr>
                                    <td style="padding:12px 14px; background:#f8fafc; font-weight:600; color:#334155;">
                                        Email</td>
                                    <td style="padding:12px 14px;">{{ $user->email }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 24px 28px;">
                            <a href="{{ $frontendUrl }}/dashboard/credits"
                                style="display:inline-block; background:#f97316; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:10px; font-weight:700; font-size:14px;">View
                                Credits</a>
                            <p style="margin:16px 0 0; color:#64748b; font-size:13px;">Questions about this receipt?
                                Contact us at {{ $supportEmail }}.</p>
                        </td>
                    </tr>
                    <tr>
                        <td
                            style="padding:14px 24px; background:#f8fafc; color:#64748b; font-size:12px; text-align:center; border-top:1px solid #e2e8f0;">
                            &copy; {{ $year }} {{ $appName }}. All rights reserved.</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
