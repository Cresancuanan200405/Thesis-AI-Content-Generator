<?php

namespace App\Policies;

use App\Models\Design;
use App\Models\User;

class DesignPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Design $design): bool
    {
        return $user->id === $design->user_id;
    }

    public function update(User $user, Design $design): bool
    {
        return $user->id === $design->user_id;
    }

    public function delete(User $user, Design $design): bool
    {
        return $user->id === $design->user_id;
    }

    public function download(User $user, Design $design): bool
    {
        return $this->view($user, $design);
    }

    public function regenerate(User $user, Design $design): bool
    {
        return $this->view($user, $design);
    }
}
