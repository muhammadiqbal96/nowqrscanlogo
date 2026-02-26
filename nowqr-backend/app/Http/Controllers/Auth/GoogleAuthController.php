<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to Google's OAuth page.
     */
    public function redirect(): JsonResponse
    {
        /** @var \Laravel\Socialite\Two\GoogleProvider $driver */
        $driver = Socialite::driver('google');
        $url = $driver
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    /**
     * Handle the callback from Google.
     */
    public function callback(Request $request): RedirectResponse
    {
        try {
            /** @var \Laravel\Socialite\Two\GoogleProvider $driver */
            $driver = Socialite::driver('google');
            $googleUser = $driver->stateless()->user();

            $user = User::where('google_id', $googleUser->getId())
                ->orWhere('email', $googleUser->getEmail())
                ->first();

            if ($user) {
                // Update Google ID if user exists by email but hasn't linked Google yet
                if (!$user->google_id) {
                    $user->update([
                        'google_id' => $googleUser->getId(),
                        'avatar' => $googleUser->getAvatar(),
                    ]);
                }
            } else {
                // Create new user
                $names = explode(' ', $googleUser->getName(), 2);

                $user = User::create([
                    'first_name' => $names[0] ?? '',
                    'last_name' => $names[1] ?? '',
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'email_verified_at' => now(),
                    'password' => null,
                    'plan' => 'free',
                    'credits' => 0,
                ]);

                // Give signup bonus
                $user->addCredits(10, 'signup_bonus', 'Welcome bonus credits');
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            // Redirect to frontend with token
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect("{$frontendUrl}/auth/callback?token={$token}");

        } catch (\Exception $e) {
            Log::error('Google OAuth error: ' . $e->getMessage());
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect("{$frontendUrl}/login?error=google_auth_failed");
        }
    }
}
