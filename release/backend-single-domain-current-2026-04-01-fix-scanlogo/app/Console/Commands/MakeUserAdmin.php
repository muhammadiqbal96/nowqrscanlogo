<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeUserAdmin extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'user:make-admin {email : The email of the user to make admin}';

    /**
     * The console command description.
     */
    protected $description = 'Make a user admin by their email address';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email '{$email}' not found.");
            return Command::FAILURE;
        }

        if ($user->is_admin) {
            $this->warn("{$user->full_name} ({$email}) is already an admin.");
            return Command::SUCCESS;
        }

        $user->update(['is_admin' => true]);

        $this->info("✅ {$user->full_name} ({$email}) is now an admin!");

        return Command::SUCCESS;
    }
}
