<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeSignupMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to ScanLogo - Your account is ready',
        );
    }

    public function content(): Content
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', 'http://localhost:5173'), '/');

        return new Content(
            view: 'emails.welcome-signup',
            with: [
                'user' => $this->user,
                'frontendUrl' => $frontendUrl,
                'appName' => config('app.name', 'ScanLogo'),
                'supportEmail' => config('mail.from.address'),
                'year' => now()->year,
            ],
        );
    }
}
