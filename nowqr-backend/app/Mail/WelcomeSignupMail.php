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
            subject: 'Welcome to NowQR - Your account is ready',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome-signup',
            with: [
                'user' => $this->user,
                'frontendUrl' => config('app.frontend_url'),
                'appName' => config('app.name', 'NowQR'),
                'supportEmail' => config('mail.from.address'),
                'year' => now()->year,
            ],
        );
    }
}
