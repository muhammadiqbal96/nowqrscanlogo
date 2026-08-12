<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
    ],

    'paypal' => [
        'mode' => env('PAYPAL_MODE', 'sandbox'),
        'client_id' => env('PAYPAL_CLIENT_ID'),
        'client_secret' => env('PAYPAL_CLIENT_SECRET'),
        'verify_ssl' => (bool) env('PAYPAL_VERIFY_SSL', true),
        'timeout' => (int) env('PAYPAL_TIMEOUT', 20),
    ],

    'printify' => [
        // 'stub' returns deterministic fake responses and never calls Printify.
        // Switch to 'live' only once api_token and shop_id are set.
        'mode' => env('PRINTIFY_MODE', 'stub'),
        'api_token' => env('PRINTIFY_API_TOKEN'),
        'shop_id' => env('PRINTIFY_SHOP_ID'),
        'base_url' => env('PRINTIFY_BASE_URL', 'https://api.printify.com/v1'),
        'timeout' => (int) env('PRINTIFY_TIMEOUT', 30),

        // Orders are created on Printify as drafts. They are only charged and
        // printed once send_to_production is called. Keep this false until the
        // whole flow has been checked against a real account.
        'auto_send_to_production' => (bool) env('PRINTIFY_AUTO_SEND_TO_PRODUCTION', false),

        // Shipping is baked into the retail price, so the customer is never
        // charged for it. We still quote it per order to record true margin.
        'quote_shipping' => (bool) env('PRINTIFY_QUOTE_SHIPPING', true),

        // Empty list = ship anywhere. Otherwise an ISO country allowlist, which
        // is the only guard against a destination whose shipping exceeds margin.
        'allowed_countries' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('PRINTIFY_ALLOWED_COUNTRIES', ''))
        ))),
    ],

];
