# THESIS DEMONSTRATION CHECKLIST & STEP-BY-STEP SCRIPT

**Demonstration Target:** CoffeYessir — Caramel Machiato Live Campaign  
**Execution Environment:** Localhost / Production Build  

---

## 📋 Pre-Demo Setup Checklist

Verify all items before opening the live defense presentation:

- [ ] **PHP Web Server:** Active and responding (`php artisan serve` or local web server).
- [ ] **Frontend Build:** Production assets built (`npm run build`) or Vite dev server active.
- [ ] **Database Connection:** SQLite / MySQL database initialized and migrated.
- [ ] **Authentication:** Test user account active (`user@coffeyessir.com` or default tenant).
- [ ] **Business Profile:** `CoffeYessir` (Cafe & Beverages, Warm & Welcoming) configured.
- [ ] **Product Catalog:** `Caramel Machiato` (Product ID: 6, ₱149) with high-res photo loaded.
- [ ] **Event Availability:** `Mother's Day Special` available in the Philippine event engine.
- [ ] **OpenAI API Key:** Configured server-side with active quota balance.
- [ ] **Browser Ready:** Browser open, dark-mode active, developer console clean.

---

## 🎬 Step-by-Step Live Defense Script

| Step | Action | What to Say / Point Out to Panel |
| :---: | :--- | :--- |
| **1** | Log in to the application. | "We begin by authenticating into the platform under the verified business tenant." |
| **2** | Navigate to **Business Profile**. | "The system loads the merchant profile: CoffeYessir, classified under Cafe & Beverages with a Warm & Welcoming brand voice." |
| **3** | Navigate to **Product Catalog**. | "Here is our product catalog. We select our featured product: **Caramel Machiato**." |
| **4** | Inspect original product photo. | "Notice the original photograph: faceted short glass, brown straw, ice cubes, caramel syrup layering, and coffee-to-milk gradient. This photo is our primary visual source of truth." |
| **5** | Open **AI Studio (Generator)**. | "We transition to the AI Studio. The system auto-links the selected product." |
| **6** | Select Event / Holiday. | "We choose **Mother's Day Special** from our Philippine holiday engine." |
| **7** | Enter Campaign Offer Details. | "Price is set to `₱149` and the exact tagline: `'Rich caramel sweetness, brewed to perfection.'`" |
| **8** | Select Render Style & Model. | "We select exactly one render style: **Studio Product Still**, and our recommended engine: **GPT-Image-2**." |
| **9** | Click **Generate Visual Creative**. | "When we trigger generation, the system sends the actual product binary via multipart upload to OpenAI's Image Edits API." |
| **10** | Highlight Generation State. | "Notice the staged progress visualizer and the realistic observed runtime indicator (~26–36s) with duplicate-click protection." |
| **11** | Inspect Generated Creative. | "The creative is synthesized! Look at the result: the background is transformed into a warm Mother's Day cafe scene." |
| **12** | Verify Product Preservation. | "Compare the drink against the original photo: the faceted glass shape, straw angle, ice cubes, and caramel layering are preserved without AI distortion." |
| **13** | Open **Generation Details**. | "Expanding the Generation Details summary confirms: Model: GPT-Image-2, Method: Image-to-Image Edit, Product Source: Catalog Product Preserved, Safe Margin: 20%." |
| **14** | Click **Regenerate Variation**. | "To show environmental flexibility, we click Regenerate. The AI creates a fresh background arrangement while the drink remains identical." |
| **15** | Click **Save to Designs**. | "We save this approved asset into our tenant's persistent library." |
| **16** | Navigate to **My Designs**. | "In My Designs, the creative is permanently cataloged with its campaign metadata." |
| **17** | Click **Download Visual (PNG)**. | "We download the high-resolution PNG, ready for immediate social media publication." |

---

## 🏁 Post-Demo Verification Checklist

- [ ] Confirm saved design record appears in database.
- [ ] Confirm downloaded PNG contains intact 20% safe-margin typography.
- [ ] Confirm no duplicate generation requests were created.
- [ ] Retain demonstration screenshots for appendix documentation.
