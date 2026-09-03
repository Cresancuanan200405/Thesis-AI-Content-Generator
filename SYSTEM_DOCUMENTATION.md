# Final System Documentation: AI-Driven Marketing Image Generation

**System:** MarketPilot / AI Marketing Automation  
**Document status:** Final implementation-aligned documentation  
**Evidence date:** September 2, 2026

## 1. System Understanding

The final system is an **AI-driven marketing image generation system for product-based promotional content**. It helps an authenticated business user combine business context, product information, product imagery when available, a selected Philippine holiday or marketing event, and creative preferences to produce an AI-generated marketing image.

The primary output is a marketing image. Users can preview it, save it to My Designs, download it, or regenerate a new variation. The system does not publish images to external platforms and does not manage external social accounts.

## 2. Complete Architecture

```text
User
  -> Fortify authentication and email verification
  -> Optional social OAuth login (Google or Facebook)
  -> Onboarding and business profile
  -> Product catalog and product image upload
  -> Philippine holiday / marketing event selection
  -> Optional campaign context
  -> AI Marketing Studio
  -> Prompt brief and modular creative direction
  -> Product-aware OpenAI image generation
  -> Preview image stored on the public disk
  -> Save Design creates a persistent Design record
  -> My Designs: view, filter, download, regenerate, delete
```

### Verified technology stack

- Laravel Framework 13.25.0; Composer allows PHP 8.3 or newer.
- Inertia Laravel 3.3.1, React 19, TypeScript, and Tailwind CSS 4.
- Laravel Fortify 1.38.0 for authentication, verification, password reset, and two-factor support.
- Laravel Socialite 5.30.0 for Google and Facebook login only.
- Pest 5.1.0 with the Laravel plugin for automated tests.
- Eloquent ORM with the configured database connection and Laravel public storage disk.
- OpenAI HTTP API integration through server-side Laravel services.

## 3. Feature Inventory

### Core

- Business profile creation and editing.
- Product catalog with name, description, category, price, and optional image.
- Philippine holiday, observance, commercial-date, and custom-event selection.
- Campaign records with objectives and optional event/product associations.
- AI Marketing Studio for configuring and generating promotional images.
- Product-reference image editing when a supported reference image is available.
- Text-to-image generation when no usable reference image is available.
- Marketing image preview, save, download, and regeneration.

### Supporting

- Brand tone, visual theme, render style, tagline, price, aspect ratio, and business-name controls.
- Vision analysis as supplemental reference metadata.
- OpenAI usage telemetry, budget checks, and quota notifications.
- Design metadata snapshots, generation request records, and campaign linking.
- Soft deletion for products and designs.

### UX

- Inertia React pages with responsive layouts.
- AI Marketing Studio loading state with status phrases, animated progress indication, and error state.
- Preview and design-detail views with zoom, download, favorite, and regeneration actions.
- Responsive aspect-ratio preview presentation.
- Toast notifications and tab-leave warnings during synchronous generation.

### Security

- Fortify authentication, verified email, password reset, login throttling, and two-factor authentication support.
- Laravel policies for products, events, campaigns, and designs.
- Server-side OpenAI credentials.
- CSRF protection on state-changing web requests.
- Form-request validation for the main generator/store flows and image uploads.
- Ownership checks for normal product, event, campaign, and design workflows.

### Infrastructure

- Laravel migrations and Eloquent relationships.
- Wayfinder-generated route/action types for the frontend.
- CI workflow running build, lint, formatting, type checking, PHPStan, Pint, and Pest.
- Public storage symlink for browser image retrieval and downloads.

## 4. AI Pipeline

1. The Studio collects product, business, event, campaign, and creative settings.
2. The backend resolves the selected product, campaign, event, business, and reference image path.
3. `MarketingPromptBuilder` creates a promotional advertisement brief.
4. `ReferenceImageAnalyzer` may inspect a reference image with OpenAI Vision and returns supplemental metadata.
5. `ModularPromptOrchestrator` creates the final structured prompt.
6. `OpenAIImageService` chooses the configured model and maps the selected aspect ratio to an API canvas size.
7. With a supported reference image, the service attaches the binary to `/v1/images/edits`.
8. Without a usable reference image, or when editing fails, the service calls `/v1/images/generations`.
9. The returned base64 image or temporary URL is decoded/downloaded and saved as `designs/openai_{uuid}.png` on the public disk.
10. Preview returns the generated image path and metadata without creating a permanent Design record.
11. Save creates the Design record; regeneration creates a new GenerationRequest and a new Design.

The generation request is synchronous. The progress bar and rotating messages are user-interface feedback, not independently measured backend stages.

## 5. Industry and Event Logic

`IndustryCategoryArtDirectionService` contains explicit art-direction branches for food and beverage, beauty and wellness, automotive, technology, retail and fashion, real estate, travel and hospitality, healthcare, fitness, professional services, and education, plus a generic commerce fallback. Each branch supplies environment, surfaces/materials, lighting, restrained props, commercial conventions, and things to avoid.

The selected industry and category are passed into the orchestrator. They influence the environmental and commercial presentation around the product; they do not replace product identity or override an explicit user scene direction.

`PhilippineHolidayService` generates repository-defined calendar data for regular holidays, special non-working holidays, special working observances, Islamic holidays, commercial shopping dates, shifted dates, long-weekend metadata, and custom events. The system stores event data and exposes global events plus the authenticated user's events. The repository contains proclamation labels, but external legal or government verification is outside the local test evidence.

The orchestrator maps recognized event names to structured direction including mood, environment, lighting, decorative direction, spatial staging, and marketing intent. This direction is environmental and promotional context. It does not automatically create or publish a campaign.

## 6. Product Pipeline

Product images may be uploaded through the product catalog or supplied as a Studio reference image. Main image uploads are validated as JPG, JPEG, PNG, or WebP files up to 5 MB and stored through Laravel's public disk. Product catalog images are referenced by their stored path; generated images use UUID-based filenames such as `designs/openai_{uuid}.png`.

When a product image exists, the backend uses the stored binary as the primary visual reference for the image-edit request when the selected model supports image input. Vision analysis can provide supplemental observations such as identity and visual characteristics, but it does not replace the binary reference.

When no usable product/reference image exists, the model receives product name, description, category, business context, and the creative prompt and synthesizes the product and scene from text.

The implementation directs the model to preserve recognizable product identity and to keep environmental changes around the product. This is a model-dependent image-editing result, not a guarantee of pixel-perfect preservation. If the edit request fails, the service may fall back to text-to-image generation.

## 7. Prompt Orchestration and Copy

The active orchestrator contains a root objective and output/safety guardrails around ten ordered priority modules:

1. Primary product image and product-preservation handling.
2. User scene or visual direction.
3. Final marketing copy.
4. Campaign name and objective.
5. Event or Philippine holiday direction.
6. Industry and category art direction.
7. Business context and brand identity.
8. Render style.
9. Visual theme.
10. Responsive composition profile and invisible safe area.

The prompt also includes an anti-logo mandate and output-cleanliness rules. Lower-priority environmental styling is instructed not to replace the product or contradict the user's explicit scene direction.

Business/shop name, product name, price, and normalized tagline are supplied as exact copy instructions when enabled. The model is asked to render them as commercial typography. AI-generated text may still contain visual or spelling errors and should be reviewed by the user.

The final implementation does not generate or composite a user logo. Business-name typography is explicitly distinguished from a logo, emblem, watermark, or brand mark.

### Tagline normalization

`TaglineNormalizationService` trims whitespace, removes enclosing straight or smart quotes, removes repeated trailing periods/ellipses, and removes trailing connector/punctuation characters including commas, colons, semicolons, ampersands, dashes, slashes, pipes, underscores, and tildes. It preserves intentional trailing `!` and `?`, preserves legitimate internal characters, and returns `null` for an empty result. It normalizes wording; it does not generate a new tagline.

## 8. Rendering and Persistence

The Studio displays an idle state, synchronous generating state, error state, and ready preview. The generating state includes rotating status text, a simulated progress indication, contextual product/event information, tab-leave warning behavior, and responsive preview handling.

`ImageCompositorService` currently generates a compositing **manifest** containing canvas dimensions, 20% safe-margin coordinates, and exact content metadata. It does not load image pixels, draw text, or produce a composited raster file. The generated marketing image and its copy therefore come from the OpenAI image-generation response, except for the testing/local SVG fallback in `MockupImageService`.

The supported requested ratios are `1:1`, `9:16`, `16:9`, `4:5`, and `4:3`. OpenAI request mapping currently uses `1024x1024`, `1024x1792`, or `1792x1024`; the manifest uses `1024x1280` for `4:5` and `1365x1024` for `4:3`. These implementation differences should be treated as a known technical limitation rather than described as a single deterministic canvas specification.

## 9. Security Audit

### Verified protections

- Authenticated routes are protected by session authentication, email verification, and onboarding middleware where configured.
- Resource policies authorize design, product, event, and campaign actions.
- Normal generator and save requests validate resource ownership after existence validation.
- Notification queries are user-scoped.
- OpenAI keys remain in server-side configuration.
- Uploaded reference images are constrained by type and size on the main generation paths.
- Eloquent and parameterized query builders are used for database access.

### Remaining concerns

- `GeneratorController::generatePreview` uses a smaller inline validation set and does not repeat all ownership checks performed by `GeneratorRequest`; preview tenant isolation requires hardening and live verification.
- The save shortcut accepting `generated_image_path` should verify that the path belongs to the current user's generation before persisting it.
- Social OAuth uses stateless handling and should be reviewed against the desired CSRF/state threat model.
- Production configuration must disable debug mode, configure durable storage, and provide a production queue/mail/database strategy.
- Generation endpoints have quota protection, but no separate image-generation rate limiter was verified.

## 10. Database Audit

```text
User 1--1 Business
User 1--N Event, Campaign, Design, GenerationRequest, AppNotification, Product
Business 1--N Product, Campaign, Design
Campaign N--1 Event/Product (optional) and 1--N Design
Design N--1 Event/Product/Campaign (optional)
GenerationRequest N--1 Event/Product/Campaign (optional)
```

Events are user-scoped or global; they do not use a `business_id` relationship in the final model. Products and designs use soft deletes. Foreign-key nulling/cascade behavior is defined by the migrations and should be checked before destructive production operations.

## 11. Testing Audit

The current local Pest run completed successfully:

- **269 tests passed**
- **1,496 assertions**
- **Duration:** approximately 94 seconds in the current environment

The tests cover authentication and Socialite login, onboarding, business/profile behavior, product and event workflows, campaign behavior, design creation and regeneration, prompt orchestration, tagline normalization, industry art direction, quotas, notifications, and ownership/security cases. The exact declaration count is less useful than the executed Pest total above; it should be refreshed whenever the suite changes.

Additional local verification completed for the final implementation includes `npm run types:check`, targeted ESLint checks, and `npm run build`. The build reports only existing advisory warnings about optional `fontaine` and bundle size.

## 12. Production Readiness

**Decision: YELLOW CONDITIONAL GO.**

### Verified locally

- Full Pest suite passes at 269/269 with 1,496 assertions.
- TypeScript compilation passes.
- Production Vite build passes.
- CI workflow defines frontend build, lint, formatting, PHPStan, Pint, and Pest stages.
- Routes, migrations, authentication configuration, storage paths, and OpenAI service wiring are present.

### Requires staging or production verification

- Live OpenAI image generation, latency, model availability, and account billing behavior.
- Actual product-reference fidelity and generated typography quality.
- OAuth callback behavior with provider credentials.
- Accuracy of proclamation dates against current Philippine government sources.
- Preview tenant isolation and generated-path ownership validation.
- Production storage durability, queue/worker operation, mail delivery, backups, monitoring, HTTPS, and debug settings.

## 13. Documentation Discrepancies

| Documentation claim | Actual implementation | Status | Required revision |
|---|---|---|---|
| Laravel 12 | Laravel 13.25.0 is installed | Outdated | Use Laravel 13.25.0 |
| 8-priority prompt system | Ten ordered modules plus root/output guardrails | Outdated | Document the active ten-priority hierarchy |
| Deterministic compositor renders exact copy | Compositor returns a manifest only; OpenAI is instructed to render copy | Incorrect | Describe manifest metadata and model-dependent text |
| Exact/pixel-perfect product preservation | Image edits use the reference binary, but output remains model-dependent | Overstated | Use qualified product-reference wording |
| SHA-256 product filenames | Laravel-generated stored paths; generated designs use UUID names | Incorrect | Describe actual storage naming |
| Events belong to businesses | Events belong to users or are global | Incorrect | Correct relationships |
| 153 or 261 tests | Current run is 269 tests and 1,496 assertions | Outdated | Use dated current evidence |
| Meta Graph API/social publishing roadmap as system capability | No publishing routes, API, jobs, or platform-token model exists | Out of scope | State manual download/export only |
| Facebook integration | Facebook exists only as Socialite login | Ambiguous | Label it authentication-only |

## 14. Scope and Limitations

- The final system focuses on marketing image generation and design management.
- It does not directly publish to Facebook, Instagram, or any other external platform.
- It does not automatically manage external social accounts or schedule posts to external platforms.
- AI output, product fidelity, and rendered copy require user review.
- Preview files can be written to public storage before a user saves a permanent Design record.
- Aspect-ratio request and manifest dimensions are not fully uniform for `4:5` and `4:3`.
- External OpenAI availability, account quota, network latency, and model behavior affect generation.
- The repository includes an OAuth login flow for Google and Facebook; that is authentication, not content publishing.
