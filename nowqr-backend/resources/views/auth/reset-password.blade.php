<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Set new password - {{ config('app.name', 'NowQR') }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: 'hsl(16 85% 44%)',
                        foreground: 'hsl(224 71% 4%)',
                        muted: 'hsl(220 9% 46%)',
                        card: 'hsl(0 0% 100%)',
                        border: 'hsl(220 13% 91%)',
                    },
                    fontFamily: {
                        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-white text-foreground antialiased overflow-x-hidden min-h-screen">
    <div class="min-h-screen flex items-center justify-center px-4">
        <div class="w-full max-w-md">
            <div class="mb-8">
                <a href="/" class="flex items-center gap-2 mb-8 text-foreground no-underline">
                    <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" /><rect x="4.5" y="4.5" width="3" height="3" rx="0.5" fill="white" /><rect x="14" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" /><rect x="16.5" y="4.5" width="3" height="3" rx="0.5" fill="white" /><rect x="2" y="14" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" /><rect x="4.5" y="16.5" width="3" height="3" rx="0.5" fill="white" /><rect x="14" y="14" width="3" height="3" fill="white" rx="0.5" /><rect x="19" y="14" width="3" height="3" fill="white" rx="0.5" /><rect x="14" y="19" width="3" height="3" fill="white" rx="0.5" /><rect x="19" y="19" width="3" height="3" fill="white" rx="0.5" /></svg>
                    </div>
                    <span class="text-xl font-bold text-foreground">Now<span class="text-primary">QR</span></span>
                </a>
                <h1 class="text-3xl font-bold mb-2">Set new password</h1>
                <p class="text-muted">Enter your new password below.</p>
            </div>

            @if (session('status'))
                <div class="mb-6 p-4 text-sm text-green-800 bg-green-50 rounded-xl border border-green-200">
                    {{ session('status') }}
                </div>
            @endif

            @if (!session('status') || !session('loginUrl'))
                <form id="reset-password-form" method="POST" action="{{ route('password.reset.submit') }}" class="space-y-4">
                    @csrf
                    <input type="hidden" name="token" value="{{ old('token', $token) }}" />

                    <div>
                        <label for="email" class="block text-sm font-medium mb-1.5">Email</label>
                        <input id="email" name="email" type="email" value="{{ old('email', $email) }}" required readonly class="w-full px-4 py-3 bg-gray-50 border border-border rounded-xl text-sm text-muted focus:outline-none" />
                        @error('email')
                            <p class="mt-1 text-sm text-red-700">{{ $message }}</p>
                        @enderror
                    </div>

                    <div>
                        <label for="password" class="block text-sm font-medium mb-1.5">New Password</label>
                        <input id="password" name="password" type="password" minlength="8" required placeholder="Enter new password" class="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all" />
                        @error('password')
                            <p class="mt-1 text-sm text-red-700">{{ $message }}</p>
                        @enderror
                    </div>

                    <div>
                        <label for="password_confirmation" class="block text-sm font-medium mb-1.5">Confirm Password</label>
                        <input id="password_confirmation" name="password_confirmation" type="password" required placeholder="Confirm new password" class="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all" />
                        <p id="password-mismatch-error" class="mt-1 text-sm text-red-700 hidden">Passwords do not match.</p>
                        @error('password_confirmation')
                            <p class="mt-1 text-sm text-red-700">{{ $message }}</p>
                        @enderror
                    </div>

                    <button type="submit" class="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 text-sm">
                        Reset Password
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </button>
                </form>
            @endif

            @if (session('status') && session('loginUrl'))
                <div class="mt-4">
                    <a href="{{ session('loginUrl') }}" class="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 text-sm no-underline">
                        Go to Login
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </a>
                </div>
            @endif
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const form = document.getElementById('reset-password-form');
            const passwordInput = document.getElementById('password');
            const confirmInput = document.getElementById('password_confirmation');
            const mismatchError = document.getElementById('password-mismatch-error');

            if (!form || !passwordInput || !confirmInput || !mismatchError) {
                return;
            }

            const clearClientMismatch = function () {
                mismatchError.classList.add('hidden');
                confirmInput.setCustomValidity('');
            };

            passwordInput.addEventListener('input', clearClientMismatch);
            confirmInput.addEventListener('input', clearClientMismatch);

            form.addEventListener('submit', function (event) {
                clearClientMismatch();

                if (!passwordInput.value || !confirmInput.value) {
                    return;
                }

                if (passwordInput.value !== confirmInput.value) {
                    event.preventDefault();
                    mismatchError.classList.remove('hidden');
                    confirmInput.setCustomValidity('Passwords do not match.');
                    confirmInput.reportValidity();
                }
            });
        });
    </script>
</body>
</html>
