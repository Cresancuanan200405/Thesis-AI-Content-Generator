# Thesis Demonstration Checklist: Final System

**Demonstration target:** AI-generated product promotional image  
**Evidence date:** September 2, 2026

## Pre-Demo Setup

- [ ] PHP/Laravel server is running.
- [ ] Frontend assets are built with `npm run build` or a Vite dev server is active.
- [ ] Database is migrated and the public storage link is available.
- [ ] Test account is authenticated, email-verified, and onboarding-complete.
- [ ] Business profile has a name, industry, and category.
- [ ] Product catalog contains a product with optional reference image and price.
- [ ] A Philippine holiday or marketing event is available.
- [ ] `OPENAI_API_KEY` is configured server-side and the account has available budget.
- [ ] Browser console is clear of relevant runtime errors.

## Demonstration Script

| Step | Action | Evidence-based explanation |
|---:|---|---|
| 1 | Log in. | Fortify authenticates the user and applies the configured verification flow. |
| 2 | Review onboarding/business profile. | Business name, industry, category, description, and preferences provide generation context. |
| 3 | Open Product Catalog. | Products store name, description, category, price, and an optional image on the public disk. |
| 4 | Open AI Marketing Studio. | The Studio collects product, event, campaign, and creative settings. |
| 5 | Select a product and event. | The event is required by the main generation flow and becomes part of AI creative direction. |
| 6 | Configure price, tagline, tone, theme, render style, and ratio. | These values are sent as prompt and model-generation inputs. |
| 7 | Generate a preview. | The backend builds the promotional brief, orchestrates the prompt, and calls OpenAI. |
| 8 | Observe rendering state. | The UI shows status phrases and progress feedback while synchronous generation runs. These are UX indicators, not separately measured backend stages. |
| 9 | Inspect the preview. | With a supported reference image, the stored binary was used as the primary image-edit reference; without one, the model synthesized the product from text. |
| 10 | Open generation details. | Review model, method, aspect ratio, prompt metadata, and reference-analysis metadata where available. |
| 11 | Save the design. | Save creates a persistent Design record; preview alone does not create one. |
| 12 | Open My Designs. | Saved marketing images can be filtered, previewed, favorited, downloaded, deleted, or regenerated. |
| 13 | Regenerate a design. | Regeneration recovers the saved context, creates a new GenerationRequest, reruns the AI pipeline, and stores a new Design variation. |
| 14 | Download the image. | The authorized download route returns the stored generated image file. External publication is manual and outside the system. |

## Demonstration Claims To Avoid

- Do not claim that the system preserves every product pixel or guarantees exact generated typography.
- Do not claim that `ImageCompositorService` renders final text; it creates a metadata manifest.
- Do not claim that the system generates logos; business-name typography is explicitly not a logo.
- Do not claim direct publishing, automatic posting, or external account management.
- Do not claim that all holiday dates have been independently verified against live government sources.

## Post-Demo Verification

- [ ] Confirm the saved Design appears in My Designs.
- [ ] Confirm the generated file is retrievable through the authorized download route.
- [ ] Confirm the regeneration creates a new Design and GenerationRequest.
- [ ] Confirm no relevant browser errors occurred.
- [ ] Record the actual model, ratio, generation method, and observed runtime.
- [ ] Record whether the run used a product reference image or text-to-image mode.
