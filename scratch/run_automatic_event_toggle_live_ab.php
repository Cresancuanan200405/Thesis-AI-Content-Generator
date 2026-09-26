<?php

use App\Http\Controllers\AutomaticGeneratorController;
use App\Models\Campaign;
use App\Models\Product;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$user = User::where('email', 'cresancuanan182@gmail.com')->first();
if (! $user) {
    echo "ERROR: User cresancuanan182@gmail.com not found.\n";
    exit(1);
}

auth()->login($user);

$campaign = Campaign::where('id', 20)->with('event')->first();
$product = Product::where('id', 32)->first();

echo "Running Real Automatic A/B Test...\n";
echo 'Business: '.$user->business->name.' ('.$user->business->industry.")\n";
echo 'Campaign: '.$campaign->name.' (Event: '.($campaign->event?->name ?? 'None').")\n";
echo 'Product: '.$product->name.' (Price: '.$product->price.")\n\n";

$tests = [
    'TEST_A' => [
        'name' => 'Test A (show_event_text = true)',
        'show_event_text' => true,
        'output_image_name' => 'automatic_event_ab_true.png',
    ],
    'TEST_B' => [
        'name' => 'Test B (show_event_text = false)',
        'show_event_text' => false,
        'output_image_name' => 'automatic_event_ab_false.png',
    ],
];

$results = [];

foreach ($tests as $key => $testConfig) {
    echo "========================================================\n";
    echo 'STARTING '.$testConfig['name']."\n";
    echo 'show_event_text: '.($testConfig['show_event_text'] ? 'TRUE' : 'FALSE')."\n";
    echo "========================================================\n";

    $payload = [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'custom_products' => [],
        'include_tagline' => true,
        'include_prices' => true,
        'include_business_name' => true,
        'aspect_ratio' => '1:1',
        'image_model' => 'gpt-image-2',
        'image_quality' => 'medium',
        'show_event_text' => $testConfig['show_event_text'],
    ];

    $request = Request::create(
        '/generator/automatic',
        'POST',
        $payload,
        [],
        [],
        [
            'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest',
        ]
    );

    // Set authenticated user on request
    $request->setUserResolver(function () use ($user) {
        return $user;
    });

    $controller = $app->make(AutomaticGeneratorController::class);
    $response = $app->call([$controller, 'generate'], ['request' => $request]);

    $status = $response->getStatusCode();
    $data = json_decode($response->getContent(), true);

    if ($status !== 200 || empty($data['success'])) {
        echo 'ERROR generating '.$key." (Status {$status}): ".($data['message'] ?? 'Unknown error')."\n";
        print_r($data);
        exit(1);
    }

    $preview = $data['preview'] ?? [];
    $imagePath = $preview['generated_image_path'] ?? null;
    $fullImagePath = storage_path('app/public/'.$imagePath);

    echo "Generation Success!\n";
    echo "Generated Image Path: {$imagePath}\n";
    echo 'Tagline: '.($preview['tagline'] ?? '')."\n";
    echo 'Creative Concept: '.($preview['creative_concept'] ?? '')."\n";
    echo 'Visual Strategy: '.($preview['visual_strategy'] ?? '')."\n";
    echo 'Prompt Preview: '.substr($preview['prompt'] ?? '', 0, 300)."...\n";

    // Copy to artifact directory
    $artifactDir = 'C:/Users/OWNER/.gemini/antigravity-ide/brain/4ad8f225-f7f5-41b5-a271-0ce0ddacd6db';
    $destination = $artifactDir.'/'.$testConfig['output_image_name'];

    if (file_exists($fullImagePath)) {
        copy($fullImagePath, $destination);
        echo "Copied image to artifact: {$destination}\n";
    } else {
        echo "WARNING: Image file not found at {$fullImagePath}\n";
    }

    $results[$key] = [
        'name' => $testConfig['name'],
        'show_event_text' => $testConfig['show_event_text'],
        'image_artifact' => $destination,
        'tagline' => $preview['tagline'] ?? '',
        'creative_concept' => $preview['creative_concept'] ?? '',
        'visual_strategy' => $preview['visual_strategy'] ?? '',
        'design_treatment' => $preview['design_treatment'] ?? '',
        'prompt' => $preview['prompt'] ?? '',
        'show_event_text_in_preview' => $preview['show_event_text'] ?? null,
    ];

    echo "\n";
    // Brief sleep between generations
    sleep(2);
}

file_put_contents(
    'C:/Users/OWNER/.gemini/antigravity-ide/brain/4ad8f225-f7f5-41b5-a271-0ce0ddacd6db/scratch/automatic_event_ab_results.json',
    json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
);

echo "A/B Test Complete! Results written to automatic_event_ab_results.json\n";
