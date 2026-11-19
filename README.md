# LessonNest

**Better Preparation. Better Teaching. Better Learning.**

Created and developed by **abdulsalamdevhub**.

LessonNest is a Nigerian secondary-school teaching-resource platform for JSS1–JSS3 and SS1–SS3, designed for teachers and school management.

## Frontend MVP included
- Responsive homepage and resource discovery library
- Search and filters for class, subject, term and resource type
- Resource detail pages with curriculum/state labels and preview disclaimers
- Pricing, school information and about pages
- Teacher registration/sign-in interface placeholders
- Teacher, school and admin workspace previews
- SEO metadata and sitemap/robots starter files

## Important integration status
The current build is a frontend MVP. Firebase authentication/database, verified admin permissions, Paystack checkout and server-side verification, entitlements, private PDF storage, and real downloads are **not enabled yet**. The UI intentionally does not simulate successful authentication or payment.

## Run locally
```bash
npm install
npm run dev
```

Build:
```bash
npm run build
```

## Before accepting real payments
1. Configure the owner's Firebase project, Authentication, Firestore rules and server-verified admin roles.
2. Select private document storage and issue short-lived download links only after checking verified purchase entitlements.
3. Implement Paystack initialization and transaction verification on the server. Never expose the Paystack secret key in browser code.
4. Replace all sample catalogue entries with original, editorially reviewed teaching materials and accurate curriculum/state labels.
5. Configure the production domain and update sitemap/canonical metadata.

See `.env.example` for placeholders. Never commit real secrets.