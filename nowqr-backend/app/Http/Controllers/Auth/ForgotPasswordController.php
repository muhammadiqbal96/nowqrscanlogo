<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;

class ForgotPasswordController extends Controller
{
    /**
     * Send a password reset link to the given email.
     */
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        try {
            Password::sendResetLink($request->only('email'));
        } catch (\Throwable $e) {
            Log::error('Forgot password email send failed', [
                'email' => $request->input('email'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Unable to send reset email right now. Please try again in a moment.',
            ], 500);
        }

        return response()->json([
            'message' => 'If an account with that email exists, we have sent a password reset link.',
        ]);
    }

    /**
     * Reset the password using a valid token.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', PasswordRule::defaults()],
            'password_confirmation' => ['required', 'string', 'same:password'],
        ], [
            'password_confirmation.same' => 'Passwords do not match.',
        ]);

        if ((string) $request->input('password') !== (string) $request->input('password_confirmation')) {
            return response()->json([
                'message' => 'Passwords do not match.',
                'errors' => [
                    'password_confirmation' => ['Passwords do not match.'],
                ],
            ], 422);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => $password,
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => __($status),
            ], 422);
        }

        return response()->json([
            'message' => 'Password has been reset successfully. Please log in with your new password.',
        ]);
    }
}
