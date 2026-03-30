<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\View\View;

class WebResetPasswordController extends Controller
{
    public function showForm(Request $request): View
    {
        return view('auth.reset-password', [
            'email' => (string) $request->query('email', ''),
            'token' => (string) $request->query('token', ''),
        ]);
    }

    public function reset(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', PasswordRule::defaults()],
            'password_confirmation' => ['required', 'string', 'same:password'],
        ], [
            'password_confirmation.same' => 'Passwords do not match.',
        ]);

        if ((string) $validated['password'] !== (string) $validated['password_confirmation']) {
            return back()
                ->withInput($request->only('email', 'token'))
                ->withErrors(['password_confirmation' => 'Passwords do not match.']);
        }

        $status = Password::reset(
            [
                'email' => $validated['email'],
                'password' => $validated['password'],
                'password_confirmation' => $validated['password_confirmation'],
                'token' => $validated['token'],
            ],
            function ($user, $password) {
                $user->forceFill([
                    'password' => $password,
                ])->save();

                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return back()
                ->withInput($request->only('email', 'token'))
                ->withErrors(['email' => __($status)]);
        }

        $loginUrl = rtrim((string) config('app.frontend_url', config('app.url', 'http://localhost:8000')), '/') . '/login';

        return redirect($loginUrl);
    }
}
