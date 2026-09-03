# Thesis Defense Cheat Sheet: Final System

**System description:** AI-driven marketing image generation system for product-based promotional content  
**Evidence date:** September 2, 2026

## 30-Second Explanation

MarketPilot helps a business owner create a promotional marketing image by combining business and industry context, product information, an optional product image, a selected Philippine holiday or marketing event, and creative preferences. The AI Marketing Studio constructs a structured creative prompt and uses OpenAI image generation to produce an image that can be previewed, saved, downloaded, or regenerated.

The system does not directly publish content to external platforms. Google and Facebook are available only as OAuth authentication providers.

## Technical Architecture

1. React 19, TypeScript, Inertia.js 3, and Tailwind CSS provide the client experience.
2. Laravel 13.25 handles routing, validation, authentication, policies, persistence, and server-side AI calls.
3. The Studio sends product, event, campaign, business, and creative inputs to the backend.
4. `MarketingPromptBuilder` and `ModularPromptOrchestrator` construct the promotional brief and ten ordered prompt modules.
5. A supported product/reference image is sent to OpenAI's `/v1/images/edits`; otherwise the service uses `/v1/images/generations`.
6. The returned image is stored on Laravel's public disk, previewed, and optionally persisted as a Design.

## Defensible Answers

### Q1. What is the primary output?
An AI-generated marketing image for a product promotion. The user can save, download, or regenerate it.

### Q2. What inputs affect generation?
Product name and optional description, product image, price, selected Philippine holiday or marketing event, optional campaign name/objective, business name, industry, category, tagline, brand tone, visual theme, render style, aspect ratio, image model, quality, and user scene direction.

### Q3. Is event selection important?
Yes. The main Studio flow requires an event ID. The selected event is included in the prompt and can contribute mood, environment, lighting, decoration, spatial staging, and marketing intent.

### Q4. How does product-aware generation work?
When a usable reference exists, the stored binary is attached to OpenAI's image-edit endpoint and the prompt identifies it as the primary visual reference. Vision analysis can add supplemental observations. This improves product-aware generation but does not guarantee identical pixels or perfect details.

### Q5. What happens without a product image?
The service uses text-to-image generation. Product name, description, category, business context, event, and creative settings guide synthesis of the product and promotional scene.

### Q6. What is the prompt hierarchy?
The active orchestrator has a root objective and output guardrails around ten modules: product preservation; user scene; marketing copy; campaign; event; industry/category art direction; business context/identity; render style; visual theme; and responsive composition/safe area.

### Q7. How is industry used?
The art-direction service has dedicated branches for food/beverage, beauty/wellness, automotive, technology, retail/fashion, real estate, travel/hospitality, healthcare, fitness, professional services, and education, plus a generic fallback. These branches guide environment, materials, lighting, restrained props, commercial conventions, and exclusions.

### Q8. How is tagline normalization different from tagline generation?
Normalization cleans user text: it trims whitespace, removes surrounding quotes, removes repeated trailing dots/ellipses and dangling punctuation/connectors, preserves internal text and final `!`/`?`, and returns null when empty. It does not invent or rewrite a tagline.

### Q9. Does the compositor render final text?
No. `ImageCompositorService` creates a metadata manifest containing canvas, safe-margin, and exact-content values. It does not draw pixels or text. The OpenAI prompt asks the image model to render enabled copy, so text accuracy remains model-dependent.

### Q10. Does the system generate logos?
No. The active prompt explicitly prohibits invented logos, emblems, badges, watermarks, and brand marks. An enabled business name may appear as typography, which is not a generated logo.

### Q11. How does regeneration work?
`DesignRegenerationService` recovers the original design's product, reference path, event, campaign, prompt, style, tone, theme, price, tagline, business context, and aspect ratio. It creates a new GenerationRequest, reruns the AI pipeline, and stores a new Design. The output is a new model-generated variation, not a guaranteed pixel-identical copy.

### Q12. How is user data protected?
Authentication, email verification, onboarding middleware, CSRF protection, request validation, Laravel policies, resource ownership checks, user-scoped notifications, and server-side API credentials are implemented. Preview ownership validation and client-supplied generated paths remain areas for hardening.

### Q13. What are the event data limitations?
The repository generates and stores Philippine holiday and marketing-event data, including proclamation labels. External government-source verification was not performed for this audit.

### Q14. What are the current test results?
The full local Pest run passed **269 tests with 1,496 assertions** on September 2, 2026. TypeScript, targeted ESLint, Pint, and the production Vite build also passed.

### Q15. Is the system production-ready?
**Yellow Conditional Go.** Local automated checks pass, but staging verification is still required for live OpenAI behavior, generated product/copy quality, OAuth callbacks, event-date accuracy, preview tenant isolation, durable storage, workers, mail, backups, monitoring, HTTPS, and production configuration.

## Scope and Limitations

- The system focuses on marketing image generation and design management.
- It does not publish directly to external platforms or manage external accounts.
- AI-generated product details and text require human review.
- Product-reference editing is model-dependent and does not guarantee pixel-perfect preservation.
- Preview files may be stored before the user saves a permanent Design.
- Requested and manifest canvas dimensions differ for some ratios.
- OpenAI availability, account budget, network latency, and model behavior affect results.
