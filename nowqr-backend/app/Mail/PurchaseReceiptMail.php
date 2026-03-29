<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PurchaseReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $receiptTitle,
        public int $credits,
        public float $amount,
        public string $currency,
        public ?string $paymentId,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "NowQR Receipt - {$this->receiptTitle}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.purchase-receipt',
            with: [
                'user' => $this->user,
                'receiptTitle' => $this->receiptTitle,
                'credits' => $this->credits,
                'amount' => $this->amount,
                'currency' => strtoupper($this->currency),
                'paymentId' => $this->paymentId,
                'frontendUrl' => config('app.frontend_url'),
                'appName' => config('app.name', 'NowQR'),
                'supportEmail' => config('mail.from.address'),
                'year' => now()->year,
            ],
        );
    }
}
