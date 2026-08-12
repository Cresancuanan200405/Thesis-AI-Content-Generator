<?php

namespace App\Policies;

use App\Models\BrandKit;
use App\Models\User;

class BrandKitPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, BrandKit $brandKit): bool
    {
        return $user->business()->exists() && $brandKit->business && $brandKit->business->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->business()->exists();
    }

    public function update(User $user, BrandKit $brandKit): bool
    {
        return $this->view($user, $brandKit);
    }

    public function delete(User $user, BrandKit $brandKit): bool
    {
        return $this->view($user, $brandKit);
    }
}
