# Final Evidence Report: AI-Driven Marketing Image Generation

**Document version:** 2.0  
**Evidence date:** September 2, 2026  
**Status:** Implementation-aligned local evidence

## 1. Final System Purpose

MarketPilot is an **AI-driven marketing image generation system for product-based promotional content**. It combines business context, product information, optional product imagery, a selected Philippine holiday or marketing event, campaign information, and creative preferences to produce an AI-generated marketing image.

The final output is previewed, optionally saved to My Designs, downloaded, or regenerated. External content publishing is outside the implemented scope.

## 2. Verified Architecture

- **Frontend:** React 19, TypeScript, Inertia.js 3, Tailwind CSS 4, Radix UI, and Lucide icons.
- **Backend:** Laravel Framework 13.25.0 with PHP 8.3+ Composer compatibility.
- **Authentication:** Laravel Fortify 1.38.0, email verification, password reset, throttling, and two-factor support.
- **OAuth:** Laravel Socialite 5.30.0 supports Google and Facebook login. This is authentication only.
- **AI services:** `MarketingPromptBuilder`, `ModularPromptOrchestrator`, `ReferenceImageAnalyzer`, `OpenAIModelRegistry`, and `OpenAIImageService`.
- **Persistence:** Eloquent models, migrations, public Laravel storage, `Design`, and `GenerationRequest` records.
- **No publishing layer:** No Graph API calls, publishing routes, platform-token model, post queue, or automatic external posting workflow was found.

## 3. Verified Generation Flow

1. An authenticated user completes onboarding and maintains a business profile.
2. The user selects or enters a product, optionally selects a product image, chooses a Philippine holiday or marketing event, and configures creative settings.
3. The Studio sends a preview request to `/generator/preview`.
4. Uploaded references are stored under `generation-requests/`; catalog images are resolved from the product record.
5. Vision analysis may produce supplemental product observations.
6. The prompt builder and orchestrator construct the promotional brief and structured prompt.
7. A supported reference image is sent as multipart input to `/v1/images/edits`; otherwise `/v1/images/generations` is used. A failed edit can fall back to text-to-image.
8. The response is decoded from base64 or downloaded from its temporary URL and stored as `designs/openai_{uuid}.png`.
9. Preview returns the image and metadata without creating a permanent Design record.
10. Save creates a Design; regeneration creates a new GenerationRequest and a new Design based on recovered inputs.

## 4. Verified Prompt System

The active prompt contains root anti-logo/output guardrails and ten ordered modules:

1. Product image and preservation handling.
2. User scene or visual direction.
3. Final marketing copy.
4. Campaign name and objective.
5. Event or Philippine holiday direction.
6. Industry/category art direction.
7. Business context and brand identity.
8. Render style.
9. Visual theme.
10. Responsive composition and invisible safe area.

The prompt instructs the model to render enabled product name, business name, price, and normalized tagline as commercial typography. The implementation does not guarantee perfect generated text or product pixels.

## 5. Product and Event Evidence

A supplied product image is used as the primary visual reference when the selected model supports image input. Vision metadata is supplemental. Without an image, the model synthesizes the product and scene from text and business context.

Industry/category branches provide environment, materials, lighting, props, commercial conventions, and exclusions for multiple business domains. The Philippine holiday service provides repository-defined regular, special, observance, Islamic, commercial, shifted-date, long-weekend, and custom-event data. Recognized event names are mapped to mood, environment, lighting, decoration, staging, and marketing intent.

These features guide generation; they do not automatically publish or distribute the resulting image.

## 6. Compositor and Rendering Finding

`ImageCompositorService` produces a metadata manifest containing canvas values, safe-margin coordinates, and exact content fields. It does not load pixels, draw text, or write a composited raster output. OpenAI is instructed to render copy in the generated image. `MockupImageService` can produce an SVG fallback for tests/local operation.

The OpenAI request maps ratios to `1024x1024`, `1024x1792`, or `1792x1024`. The manifest uses different values for `4:5` and `4:3`; this is a known implementation inconsistency.

## 7. Security Evidence and Open Concerns

### Verified locally

- Authenticated, verified, and onboarding-gated application routes.
- Laravel policies for product, event, campaign, and design actions.
- Ownership validation in the main generator/store requests.
- CSRF protection and server-side API credentials.
- Image type/size validation on main upload paths.
- User-scoped notification access and Eloquent query binding.
- AI budget checks before generation and regeneration.

### Requires hardening or live verification

- Preview validation is narrower than `GeneratorRequest` and should enforce product, event, and campaign ownership equivalently.
- The `generated_image_path` save shortcut should verify path ownership/integrity.
- Stateless OAuth handling should be reviewed for the desired provider-state protection.
- Production debug, storage, queue, mail, backup, and monitoring configuration must be verified outside this local repository.

## 8. Database Evidence

- `User` has one `Business` and many products, events, campaigns, designs, generation requests, and app notifications.
- `Business` has many products, campaigns, and designs.
- `Event` belongs to a user or is global and has campaigns/designs; it has no final `business_id` relationship.
- `Campaign` and `Design` may reference products and events.
- `GenerationRequest` records the generation context and status.
- Products and designs use soft deletes.
- Exact foreign-key actions are defined in migrations and should be considered before destructive operations.

## 9. Current Test and Build Evidence

Executed locally on September 2, 2026:

| Check | Result |
|---|---:|
| Pest suite | **269 passed** |
| Assertions | **1,496** |
| TypeScript | **Passed** |
| Targeted ESLint | **Passed** |
| Production Vite build | **Passed** |
| Laravel Pint | **Passed** |

The build reports advisory warnings for optional `fontaine` optimization and bundle size. No live OpenAI, OAuth provider, government-date, or production deployment verification was performed.

## 10. Production Readiness

**Decision: YELLOW CONDITIONAL GO.**

The local code, tests, type check, build, and CI definitions provide a strong implementation baseline. Staging verification remains required for live AI behavior, generated copy/product fidelity, provider callbacks, event-date accuracy, tenant isolation in preview, durable storage, worker operation, mail, backups, HTTPS, monitoring, and production configuration.

## 11. Discrepancy Table

| Historical claim | Verified final behavior | Revision |
|---|---|---|
| Laravel 12 | Laravel 13.25.0 | Correct version |
| 8-priority orchestrator | Ten ordered modules plus guardrails | Correct hierarchy |
| Deterministic final text compositor | Manifest only; OpenAI renders requested copy | Remove deterministic-rendering claim |
| 100% product/pixel preservation | Reference-guided, model-dependent preservation | Qualify claim |
| 153 or 261 tests | 269 tests and 1,496 assertions in current run | Use dated evidence |
| Social publishing integration | No publishing implementation; Facebook is OAuth login | Remove capability claim |
| Business-owned events | User-owned or global events | Correct data model |
| SHA-256 filenames | Laravel paths and UUID generated design filenames | Correct storage description |

## 12. Scope Statement

The system creates and manages AI-generated promotional marketing images. Users review, save, regenerate, and download those assets. It does not directly publish, schedule, or manage external social-platform content.
