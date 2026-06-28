<?php

namespace App\Http\Controllers\Auth;

use App\Mail\WelcomeSignupMail;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;

class RegisterController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'business_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', Password::defaults()],
        ]);

        $user = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'business_name' => $validated['business_name'] ?? null,
            'email' => $validated['email'],
            'password' => $validated['password'], // auto-hashed by model cast
            'plan' => 'free',
            'credits' => 0,
        ]);

        // Give signup bonus credits
        $user->addCredits(10, 'signup_bonus', 'Welcome bonus credits');

        try {
            Mail::to($user->email)->send(new WelcomeSignupMail($user));
            $user->sendEmailVerificationNotification();
        } catch (\Throwable $e) {
            Log::error('Failed to send signup emails', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'Account created successfully. Please verify your email before signing in.',
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $user->full_name,
                'business_name' => $user->business_name,
                'email' => $user->email,
                'plan' => $user->plan,
                'credits' => $user->credits,
                'avatar' => $user->avatar_url,
                'email_verified' => $user->hasVerifiedEmail(),
            ],
            'requires_email_verification' => true,
        ], 201);
    }
}
