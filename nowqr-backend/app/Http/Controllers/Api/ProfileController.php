<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Update the user's profile information.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'business_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $user->full_name,
                'business_name' => $user->business_name,
                'email' => $user->email,
                'plan' => $user->plan,
                'credits' => $user->credits,
                'avatar' => $user->avatar,
            ],
        ]);
    }

    /**
     * Change the user's password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        // If user signed up via Google and never set a password
        if (!$user->password) {
            $request->validate([
                'password' => ['required', 'string', 'min:8', 'confirmed', Password::defaults()],
            ]);
        } else {
            $request->validate([
                'current_password' => ['required', 'string'],
                'password' => ['required', 'string', 'min:8', 'confirmed', Password::defaults()],
            ]);

            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'message' => 'Current password is incorrect',
                ], 422);
            }
        }

        $user->update(['password' => $request->password]);

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }

    /**
     * Upload avatar.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $user = $request->user();
        $path = $request->file('avatar')->store("avatars/{$user->id}", 'public');

        $user->update(['avatar' => $path]);

        return response()->json([
            'message' => 'Avatar uploaded successfully',
            'avatar' => asset("storage/{$path}"),
        ]);
    }

    /**
     * Delete account.
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke all tokens
        $user->tokens()->delete();

        // Delete user and cascade
        $user->delete();

        return response()->json([
            'message' => 'Account deleted successfully',
        ]);
    }
}
