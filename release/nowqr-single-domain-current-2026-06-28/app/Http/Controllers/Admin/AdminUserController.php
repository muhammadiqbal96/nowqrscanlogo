<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\CreditTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    /**
     * List all users with pagination & search.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        // Search
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('business_name', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($plan = $request->query('plan')) {
            $query->where('plan', $plan);
        }
        if ($request->query('blocked') === 'true') {
            $query->where('is_blocked', true);
        } elseif ($request->query('blocked') === 'false') {
            $query->where('is_blocked', false);
        }

        $users = $query->withCount(['campaigns', 'scanLogos', 'creditTransactions'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($users);
    }

    /**
     * Get single user details.
     */
    public function show(User $user): JsonResponse
    {
        $user->loadCount(['campaigns', 'scanLogos', 'creditTransactions']);

        return response()->json([
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
                'is_admin' => $user->is_admin,
                'is_blocked' => $user->is_blocked,
                'blocked_at' => $user->blocked_at,
                'campaigns_count' => $user->campaigns_count,
                'scan_logos_count' => $user->scan_logos_count,
                'credit_transactions_count' => $user->credit_transactions_count,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    /**
     * Block a user.
     */
    public function block(User $user): JsonResponse
    {
        if ($user->is_admin) {
            return response()->json(['message' => 'Cannot block an admin user.'], 422);
        }

        $user->update([
            'is_blocked' => true,
            'blocked_at' => now(),
        ]);

        // Revoke all tokens
        $user->tokens()->delete();

        return response()->json([
            'message' => "User {$user->full_name} has been blocked.",
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Unblock a user.
     */
    public function unblock(User $user): JsonResponse
    {
        $user->update([
            'is_blocked' => false,
            'blocked_at' => null,
        ]);

        return response()->json([
            'message' => "User {$user->full_name} has been unblocked.",
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Give credits freely to a user.
     */
    public function giveCredits(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'amount' => ['required', 'integer', 'min:1', 'max:10000'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $user->addCredits(
            $request->amount,
            'bonus',
            "Admin bonus: {$request->reason}"
        );

        return response()->json([
            'message' => "{$request->amount} credits given to {$user->full_name}.",
            'new_balance' => $user->fresh()->credits,
        ]);
    }

    /**
     * Change user plan.
     */
    public function changePlan(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'plan' => ['required', 'in:free,creator,agency'],
        ]);

        $user->update(['plan' => $request->plan]);

        return response()->json([
            'message' => "Plan changed to {$request->plan} for {$user->full_name}.",
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Delete a user.
     */
    public function destroy(User $user): JsonResponse
    {
        if ($user->is_admin) {
            return response()->json(['message' => 'Cannot delete an admin user.'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully.',
        ]);
    }

    /**
     * Toggle admin status for a user.
     */
    public function toggleAdmin(User $user): JsonResponse
    {
        // Prevent removing own admin
        if ($user->id === request()->user()->id) {
            return response()->json(['message' => 'Cannot change your own admin status.'], 422);
        }

        $user->update(['is_admin' => !$user->is_admin]);

        $status = $user->is_admin ? 'granted' : 'revoked';

        return response()->json([
            'message' => "Admin access {$status} for {$user->full_name}.",
            'user' => $user->fresh(),
        ]);
    }
}
