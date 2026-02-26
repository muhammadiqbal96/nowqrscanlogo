<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

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

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Don't reveal whether email exists
            return response()->json([
                'message' => 'If an account with that email exists, we have sent a password reset link.',
            ]);
        }

        // Generate token
        $token = Str::random(64);

        // Store in password_reset_tokens table
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        // In production, send actual email. For now, log it.
        $resetUrl = config('app.frontend_url', 'http://localhost:5173') . "/reset-password?token={$token}&email={$request->email}";

        // Log the reset URL for development
        Log::info("Password reset URL for {$request->email}: {$resetUrl}");

        // TODO: Send email with Mail::to($user)->send(new PasswordResetMail($resetUrl));

        return response()->json([
            'message' => 'If an account with that email exists, we have sent a password reset link.',
            // Include reset URL in dev mode for testing
            'debug_reset_url' => config('app.debug') ? $resetUrl : null,
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
            'password' => ['required', 'string', 'min:8', 'confirmed', Password::defaults()],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record || !Hash::check($request->token, $record->token)) {
            return response()->json([
                'message' => 'Invalid or expired reset token.',
            ], 422);
        }

        // Check if token is expired (1 hour)
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json([
                'message' => 'Reset token has expired. Please request a new one.',
            ], 422);
        }

        // Update password
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->update(['password' => $request->password]);

        // Delete the token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Revoke all tokens
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password has been reset successfully. Please log in with your new password.',
        ]);
    }
}
