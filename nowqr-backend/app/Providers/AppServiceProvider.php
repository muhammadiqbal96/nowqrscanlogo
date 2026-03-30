<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');

        VerifyEmail::toMailUsing(function (object $notifiable, string $url) use ($frontendUrl) {
            return (new MailMessage)
                ->subject('Verify your NowQR email address')
                ->view('emails.auth.verify-email', [
                    'name' => $notifiable->first_name ?? 'there',
                    'email' => $notifiable->email,
                    'verifyUrl' => $url,
                    'frontendUrl' => $frontendUrl,
                    'appName' => config('app.name', 'NowQR'),
                    'supportEmail' => config('mail.from.address'),
                    'year' => now()->year,
                ]);
        });

        ResetPassword::createUrlUsing(function (object $user, string $token) {
            $appUrl = rtrim((string) config('app.url', 'http://localhost:8000'), '/');
            return $appUrl . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);
        });

        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            $appUrl = rtrim((string) config('app.url', 'http://localhost:8000'), '/');
            $resetUrl = $appUrl . '/reset-password?token=' . $token . '&email=' . urlencode($notifiable->email);

            return (new MailMessage)
                ->subject('Reset your NowQR password')
                ->view('emails.auth.reset-password', [
                    'name' => $notifiable->first_name ?? 'there',
                    'email' => $notifiable->email,
                    'resetUrl' => $resetUrl,
                    'frontendUrl' => $appUrl,
                    'appName' => config('app.name', 'NowQR'),
                    'supportEmail' => config('mail.from.address'),
                    'year' => now()->year,
                    'expiresInMinutes' => config('auth.passwords.users.expire', 60),
                ]);
        });
    }
}
