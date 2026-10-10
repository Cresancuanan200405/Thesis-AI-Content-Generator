<?php

namespace App\Http\Controllers;

use App\Services\GeminiVisualInspirationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class VisualInspirationController extends Controller
{
    /**
     * Display the Visual Inspiration tool page.
     */
    public function index(): Response
    {
        return Inertia::render('generator/inspiration', [
            'primaryModel' => config('services.gemini.model', 'gemini-3.1-pro-preview'),
            'fallbackModel' => config('services.gemini.fallback_model', 'gemini-3.6-flash'),
        ]);
    }

    /**
     * Analyze an uploaded reference image using Gemini in-memory without persistence.
     */
    public function analyze(Request $request, GeminiVisualInspirationService $service): JsonResponse
    {
        $request->validate([
            'image' => [
                'required',
                'file',
                'mimes:jpeg,jpg,png,webp',
                'max:10240', // 10 MB in kilobytes
            ],
            'force_fallback' => ['sometimes', 'boolean'],
        ]);

        $uploadedFile = $request->file('image');
        if (! $uploadedFile || ! $uploadedFile->isValid()) {
            return response()->json([
                'success' => false,
                'error' => 'Uploaded reference image is invalid or unreadable.',
            ], 422);
        }

        try {
            $forceFallback = $request->boolean('force_fallback');
            $realPath = $uploadedFile->getRealPath();

            $result = $service->analyze($realPath, $forceFallback);

            if (! ($result['success'] ?? false)) {
                return response()->json([
                    'success' => false,
                    'model_used' => $result['model_used'] ?? null,
                    'error' => $result['error'] ?? 'Analysis failed to produce recommendations.',
                ], 422);
            }

            return response()->json($result);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'An unexpected error occurred during visual inspiration analysis: '.$e->getMessage(),
            ], 500);
        }
    }
}
