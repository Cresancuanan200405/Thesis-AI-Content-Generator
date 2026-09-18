<?php

use App\Models\LegalAcceptance;
use App\Models\User;
use App\Services\LegalDocumentService;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

it('saves business and creates legal acceptance records when all 4 acknowledgments are accepted on About step', function () {
    $user = User::factory()->create(['onboarding_completed' => false]);
    $user->business()->create([
        'name' => 'Metro Roasters',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
    ]);

    $response = $this->actingAs($user)->post('/onboarding/business', [
        'name' => 'Metro Roasters',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
        'description' => 'Specialty coffee roaster offering single origin coffee and fresh pastries.',
        'business_address' => '456 Ayala Avenue',
        'region' => 'NCR',
        'province' => 'Metro Manila',
        'city_municipality' => 'Makati City',
        'barangay' => 'Bel-Air',
        'registration_type' => 'DTI',
        'registration_number' => 'DTI-2026-991',
        'business_permit_number' => 'BP-2026-004',
        'registration_permit_date' => '2026-01-15',
        'terms_of_service' => true,
        'privacy_notice' => true,
        'content_ip_responsibility' => true,
        'ai_content_responsibility' => true,
    ]);

    $response->assertRedirect('/onboarding?step=4');

    $business = $user->fresh()->business;
    expect($business->description)->toBe('Specialty coffee roaster offering single origin coffee and fresh pastries.')
        ->and($business->business_address)->toBe('456 Ayala Avenue')
        ->and($business->registration_number)->toBe('DTI-2026-991');

    $acceptances = LegalAcceptance::where('user_id', $user->id)->get();
    expect($acceptances)->toHaveCount(4);

    $types = $acceptances->pluck('document_type')->all();
    expect($types)->toContain('terms_of_service')
        ->toContain('privacy_notice')
        ->toContain('content_ip_responsibility')
        ->toContain('ai_content_responsibility');

    foreach ($acceptances as $acceptance) {
        expect($acceptance->user_id)->toBe($user->id)
            ->and($acceptance->document_version)->toBe(LegalDocumentService::CURRENT_VERSION)
            ->and($acceptance->accepted_at)->not->toBeNull();
    }
});

it('fails validation when one legal acknowledgment is missing on About step', function () {
    $user = User::factory()->create(['onboarding_completed' => false]);

    $response = $this->actingAs($user)->post('/onboarding/business', [
        'name' => 'Metro Roasters',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
        'description' => 'Specialty coffee roaster.',
        'terms_of_service' => true,
        'privacy_notice' => true,
        'content_ip_responsibility' => true,
        // ai_content_responsibility is missing
    ]);

    $response->assertSessionHasErrors(['ai_content_responsibility']);
    expect(LegalAcceptance::where('user_id', $user->id)->count())->toBe(0);
});

it('fails validation when multiple or all legal acknowledgments are missing on About step', function () {
    $user = User::factory()->create(['onboarding_completed' => false]);

    $response = $this->actingAs($user)->post('/onboarding/business', [
        'name' => 'Metro Roasters',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
        'description' => 'Specialty coffee roaster.',
        // all legal acknowledgments omitted
    ]);

    $response->assertSessionHasErrors([
        'terms_of_service',
        'privacy_notice',
        'content_ip_responsibility',
        'ai_content_responsibility',
    ]);
    expect(LegalAcceptance::where('user_id', $user->id)->count())->toBe(0);
});

it('is idempotent and does not create duplicate legal acceptance records on repeated submissions', function () {
    $user = User::factory()->create(['onboarding_completed' => false]);

    $payload = [
        'name' => 'Metro Roasters',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
        'description' => 'Specialty coffee roaster.',
        'terms_of_service' => true,
        'privacy_notice' => true,
        'content_ip_responsibility' => true,
        'ai_content_responsibility' => true,
    ];

    $this->actingAs($user)->post('/onboarding/business', $payload)->assertRedirect('/onboarding?step=4');
    expect(LegalAcceptance::where('user_id', $user->id)->count())->toBe(4);

    // Resubmit the exact same payload
    $this->actingAs($user)->post('/onboarding/business', $payload)->assertRedirect('/onboarding?step=4');
    expect(LegalAcceptance::where('user_id', $user->id)->count())->toBe(4);
});

it('enforces that legal acceptances are strictly attributed to the authenticated user', function () {
    $user = User::factory()->create(['onboarding_completed' => false]);
    $otherUser = User::factory()->create(['onboarding_completed' => false]);

    $response = $this->actingAs($user)->post('/onboarding/business', [
        'user_id' => $otherUser->id,
        'name' => 'Metro Roasters',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
        'description' => 'Specialty coffee roaster.',
        'terms_of_service' => true,
        'privacy_notice' => true,
        'content_ip_responsibility' => true,
        'ai_content_responsibility' => true,
    ]);

    $response->assertRedirect('/onboarding?step=4');

    // All acceptances are attributed to $user, NONE to $otherUser
    expect(LegalAcceptance::where('user_id', $user->id)->count())->toBe(4)
        ->and(LegalAcceptance::where('user_id', $otherUser->id)->count())->toBe(0);
});

it('allows optional registration document upload on About step into secure private storage', function () {
    $user = User::factory()->create(['onboarding_completed' => false]);

    $file = UploadedFile::fake()->create('dti-certificate.pdf', 300, 'application/pdf');

    $response = $this->actingAs($user)->post('/onboarding/business', [
        'name' => 'Metro Roasters',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
        'description' => 'Specialty coffee roaster.',
        'business_registration_document' => $file,
        'terms_of_service' => true,
        'privacy_notice' => true,
        'content_ip_responsibility' => true,
        'ai_content_responsibility' => true,
    ]);

    $response->assertRedirect('/onboarding?step=4');

    $business = $user->fresh()->business;
    expect($business->business_registration_document_path)->not->toBeNull()
        ->and(Storage::disk('local')->exists($business->business_registration_document_path))->toBeTrue();
});

it('ignores main_business_activity if submitted and does not save it to business model', function () {
    $user = User::factory()->create(['onboarding_completed' => false]);

    $response = $this->actingAs($user)->post('/onboarding/business', [
        'name' => 'Metro Roasters',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
        'main_business_activity' => 'Obsolete Activity Field',
        'description' => 'Specialty coffee roaster.',
        'terms_of_service' => true,
        'privacy_notice' => true,
        'content_ip_responsibility' => true,
        'ai_content_responsibility' => true,
    ]);

    $response->assertRedirect('/onboarding?step=4');

    $business = $user->fresh()->business;
    expect($business->main_business_activity)->toBeNull();
});

it('provides legal documents and user acceptances in onboarding Inertia props', function () {
    $user = User::factory()->create(['onboarding_completed' => false]);
    LegalAcceptance::create([
        'user_id' => $user->id,
        'document_type' => 'terms_of_service',
        'document_version' => LegalDocumentService::CURRENT_VERSION,
        'accepted_at' => now(),
    ]);

    $response = $this->actingAs($user)->get('/onboarding?step=2');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('legalDocuments.terms_of_service')
            ->has('legalDocuments.privacy_notice')
            ->has('legalDocuments.content_ip_responsibility')
            ->has('legalDocuments.ai_content_responsibility')
            ->where('acceptedLegalDocuments', ['terms_of_service'])
        );
});

it('verifies AI boundary: personal, registration, document path, and legal acceptance data never enter ModularPromptOrchestrator', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $userPersonalAndLegalContext = [
        // Marketing context (intentionally used)
        'business_name' => 'Island Spice Bistro',
        'business_industry' => 'Food & Beverage',
        'business_category' => 'Filipino Restaurant',
        'business_description' => 'Modern Filipino cuisine celebrating regional heirloom spices and slow-cooked traditional dishes.',
        'product_name' => 'Crispy Pork Belly Kare-Kare',
        'product_description' => 'Golden crispy pork belly served with rich peanut sauce and native vegetables.',
        'aspect_ratio' => '1:1',

        // Administrative / Legal / Personal data that must NEVER enter prompts
        'user_id' => 9999,
        'username' => 'admin_juan',
        'first_name' => 'Juan',
        'last_name' => 'Dela Cruz',
        'mobile_number' => '+639171234567',
        'registration_type' => 'DTI Business Name Registration',
        'registration_number' => 'REG-SECRET-998811',
        'business_permit_number' => 'PERMIT-CONFIDENTIAL-4422',
        'registration_permit_date' => '2026-01-01',
        'business_registration_document_path' => 'business-documents/private-secret-permit.pdf',
        'terms_of_service' => true,
        'privacy_notice' => true,
        'content_ip_responsibility' => true,
        'ai_content_responsibility' => true,
        'legal_acceptances' => [
            ['document_type' => 'terms_of_service', 'version' => 'v1.0'],
        ],
    ];

    $prompt = $orchestrator->orchestrate($userPersonalAndLegalContext);

    // Assert marketing context is present
    expect($prompt)->toContain('BUSINESS CONTEXT:')
        ->toContain('• Business Name: Island Spice Bistro')
        ->toContain('• Business Description: Modern Filipino cuisine celebrating regional heirloom spices and slow-cooked traditional dishes.')
        ->toContain('• Business Category: Filipino Restaurant');

    // Assert ALL personal, registration, document paths, and legal data are excluded
    expect($prompt)->not->toContain('Juan')
        ->not->toContain('Dela Cruz')
        ->not->toContain('admin_juan')
        ->not->toContain('+639171234567')
        ->not->toContain('REG-SECRET-998811')
        ->not->toContain('PERMIT-CONFIDENTIAL-4422')
        ->not->toContain('private-secret-permit.pdf')
        ->not->toContain('business-documents')
        ->not->toContain('terms_of_service')
        ->not->toContain('privacy_notice')
        ->not->toContain('content_ip_responsibility')
        ->not->toContain('ai_content_responsibility')
        ->not->toContain('legal_acceptances');
});
