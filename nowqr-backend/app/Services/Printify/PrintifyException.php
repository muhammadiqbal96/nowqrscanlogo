<?php

namespace App\Services\Printify;

use RuntimeException;

class PrintifyException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?int $statusCode = null,
        public readonly ?array $responseBody = null,
    ) {
        parent::__construct($message);
    }

    /**
     * Retrying is only sensible for transport failures and Printify-side errors,
     * never for a rejected payload.
     */
    public function isRetryable(): bool
    {
        return $this->statusCode === null
            || $this->statusCode >= 500
            || $this->statusCode === 429;
    }
}
