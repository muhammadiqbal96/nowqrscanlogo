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
        VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
            return (new MailMessage)
                ->subject('Verify your NowQR email address')
                ->view('emails.auth.verify-email', [
                    'name' => $notifiable->first_name ?? 'there',
                    'email' => $notifiable->email,
                    'verifyUrl' => $url,
                    'appName' => config('app.name', 'NowQR'),
                    'supportEmail' => config('mail.from.address'),
                    'year' => now()->year,
                ]);
        });

        ResetPassword::createUrlUsing(function (object $user, string $token) {
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);
        });

        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            $resetUrl = $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($notifiable->email);

            return (new MailMessage)
                ->subject('Reset your NowQR password')
                ->view('emails.auth.reset-password', [
                    'name' => $notifiable->first_name ?? 'there',
                    'email' => $notifiable->email,
                    'resetUrl' => $resetUrl,
                    'appName' => config('app.name', 'NowQR'),
                    'supportEmail' => config('mail.from.address'),
                    'year' => now()->year,
                    'expiresInMinutes' => config('auth.passwords.users.expire', 60),
                ]);
        });
    }
}
