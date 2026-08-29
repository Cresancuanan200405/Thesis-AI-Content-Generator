<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    /**
     * Display the user's current application plan and access overview.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $budgetLimit = (float) config('services.openai.budget_limit', 10.00);

        return Inertia::render('subscriptions/index', [
            'plan' => [
                'name' => 'Studio Pro Workspace',
                'status' => 'Active',
                'description' => 'AI-powered marketing automation access. Your current plan provides access to the following system capabilities.',
                'features' => [
                    [
                        'title' => 'AI Image Generation',
                        'description' => 'Generate marketing visuals using the application\'s OpenAI-powered image synthesis engine.',
                    ],
                    [
                        'title' => 'Product Preservation & Staging',
                        'description' => 'Reference and composite product catalog assets into photorealistic commercial scenes.',
                    ],
                    [
                        'title' => 'Philippine Holiday & Event Context',
                        'description' => 'Curated calendar of Philippine national and seasonal holidays with tailored art direction prompts.',
                    ],
                    [
                        'title' => '13 Industry Visual Profiles',
                        'description' => 'Specialized prompt engineering for retail, food & beverage, beauty, tech, healthcare, and more.',
                    ],
                    [
                        'title' => 'Smart Tagline Normalization',
                        'description' => 'Automated headline styling and visual overlay compositing for ready-to-publish creatives.',
                    ],
                    [
                        'title' => 'Multi-Aspect Ratio Output',
                        'description' => 'Generate creatives in standard advertising ratios: Square (1:1), Story (9:16), Landscape (16:9), Portrait (4:5), and Standard (4:3).',
                    ],
                    [
                        'title' => 'Campaign & Design Management',
                        'description' => 'Create, save, organize, regenerate variations, and track designs across multi-channel campaigns.',
                    ],
                    [
                        'title' => 'AI Usage & Telemetry Monitoring',
                        'description' => 'Track organization-level OpenAI API spend, token counts, and budget headroom in real-time.',
                    ],
                ],
                'capabilities' => [
                    [
                        'name' => 'AI Image Generation',
                        'status' => 'Available',
                        'included' => true,
                    ],
                    [
                        'name' => 'Product Asset Management',
                        'status' => 'Available',
                        'included' => true,
                    ],
                    [
                        'name' => 'Marketing Campaign Studio',
                        'status' => 'Available',
                        'included' => true,
                    ],
                    [
                        'name' => 'OpenAI Usage & Quota Monitoring',
                        'status' => 'Available',
                        'included' => true,
                    ],
                    [
                        'name' => 'Philippine Event & Holiday Library',
                        'status' => 'Available',
                        'included' => true,
                    ],
                    [
                        'name' => 'Multi-Format Asset Export',
                        'status' => 'Available',
                        'included' => true,
                    ],
                ],
            ],
            'quota' => [
                'application_configured_limit' => $budgetLimit,
                'is_unlimited' => false,
            ],
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'member_since' => $user->created_at?->format('F Y'),
            ],
        ]);
    }
}
