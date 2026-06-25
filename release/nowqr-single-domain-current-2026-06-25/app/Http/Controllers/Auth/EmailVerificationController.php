<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationController extends Controller
{
    public function verify(Request $request, int $id, string $hash): RedirectResponse
    {
        if (!$request->hasValidSignature()) {
            return redirect(config('app.frontend_url') . '/login?verification=invalid');
        }

        $user = User::find($id);
        if (!$user) {
            return redirect(config('app.frontend_url') . '/login?verification=failed');
        }

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return redirect(config('app.frontend_url') . '/login?verification=invalid');
        }

        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return redirect(config('app.frontend_url') . '/login?verified=1');
    }

    public function resend(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        /** @var User|null $user */
        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'If an account exists for this email, a verification link has been sent.',
            ]);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email is already verified. You can sign in now.',
                'already_verified' => true,
            ]);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Verification email sent. Please check your inbox.',
        ]);
    }
}
