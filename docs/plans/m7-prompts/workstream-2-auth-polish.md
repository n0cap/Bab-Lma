# Workstream 2: Auth Visual Polish

## Context

You are working on a React Native + Expo 55 mobile app (TypeScript) in `apps/mobile/`.
The auth screens exist and are functional (login, signup, OTP all work).
Your job is to **restyle** them to match the HTML prototype's visual design, without changing any business logic or API calls.

**Reference:** `prototype/Babloo Complete Version.html` — search for screen IDs: `screen-auth`, `screen-signin-email`, `screen-signin-phone`, `screen-signin-pass`, `screen-signup-email`, `screen-signup-phone`, `screen-otp`, `screen-forgot-password`

**Shared components:** Import `Button`, `Input`, `Chip`, `ProgressBar` from `../components` (created in Workstream 1).

**Theme tokens:** Import from `../theme` — `colors`, `textStyles`, `fonts`, `spacing`, `radius`, `shadows`.

## Screens to Restyle

### 1. AuthEntryScreen.tsx

The entry screen must have two sections:

**Hero section (top ~40%):**
- Background: navy (`#0E1442`)
- Two decorative blobs (View with borderRadius 50%, position absolute):
  - Blob 1: 220x220px, clay at 22% opacity, top -60, right -40
  - Blob 2: 160x160px, white at 6% opacity, bottom -80, left -30
- Logo row: 42px square (navy-mid bg, rounded r.md, Babloo "B" text or placeholder icon) + "Babloo" wordmark (Fraunces 24px bold white)
- Tagline: "Des artisans de confiance, à portée de main." — DM Sans 15px, white 62% opacity

**Auth card section (bottom, scrollable):**
- Background: bg color
- Rounded top corners: radius.xl, with -20px negative margin overlapping hero
- Box shadow: `0 -4px 24px rgba(14,20,66,0.08)`
- Content padding: 24px horizontal, 36px bottom

**Tab bar (sign in / sign up):**
- Container: bgAlt, radius.full, 4px padding
- Two tabs: flex 1, padding 10px
- Active tab: navy bg, white text, radius.full
- Inactive: transparent bg, textMuted text
- Animate indicator on switch

**SSO buttons:**
- "Continuer avec Google" — surface bg, 1.5px border, Google icon (SVG or placeholder), DM Sans 14px 600 navy
- "Continuer avec Apple" — navy bg, white text, Apple icon
- Both: height 48px, radius.full
- onPress: show toast "Bientôt disponible" (these are stubs)

**Divider:** horizontal line with "ou" text centered

**Method buttons:**
- "Continuer avec l'e-mail" — row: icon circle + label + chevron right
- "Continuer avec le téléphone" — same pattern
- Surface bg, 1.5px border, radius.lg, padding 14px 16px
- These navigate to sign-in-email / sign-in-phone screens

**Legal text (signup mode only):**
- "En créant un compte..." — 12px textSec, links underlined

### 2. SignInEmailScreen.tsx

- **Header**: BackHeader component with "Se connecter" subtitle (DM Sans 15px 600 navy)
- **Body** (scrollable, padding 24px):
  - Display title: "Bon retour." — Fraunces 26px bold navy, with clay-colored period
  - Subtitle: "Connectez-vous avec votre e-mail" — body text
  - Email Input with label "Adresse e-mail"
  - Password Input with label + "Mot de passe oublié?" link right-aligned
  - Password should have eye toggle button (show/hide)
  - Global error banner (red bg, icon + message, hidden by default)
  - Button primary "Se connecter" with loading state

### 3. SignInPhoneScreen.tsx

- Same layout as SignInEmail but:
  - Title: "Bon retour."
  - Subtitle: "Connectez-vous avec votre numéro"
  - Phone input with prefix pill: "🇲🇦 +212" (styled button, non-interactive for now)
  - Button: "Continuer"

### 4. SignUpEmailScreen.tsx

- ProgressBar at top: 50% filled (step 1/2), with "Étape 1 / 2" label
- Title: "Créer un compte."
- Subtitle: "Commençons avec votre e-mail"
- Fields: email, password (with eye toggle + "8 caractères minimum" hint), confirm password (with eye toggle)
- Global error banner
- Button: "Continuer"

### 5. SignUpPhoneScreen.tsx

- ProgressBar: 100% filled (step 2/2)
- Title: "Votre numéro."
- Subtitle: "Ajoutez votre numéro pour sécuriser votre compte"
- Phone input with +212 prefix
- Info alert (blue-ish): "Ce numéro est déjà utilisé. Se connecter?" (hidden by default)
- Button: "Recevoir le code"

### 6. OtpScreen.tsx

- Header: BackHeader with "Vérification" title
- Icon badge: 72px square, navy gradient bg, radius.xl, phone icon inside, outer shadow ring (8px at 8% opacity)
- Title: "Code envoyé par SMS"
- Subtitle: "Entrez le code à 6 chiffres envoyé au"
- Phone display: Fraunces 20px bold, masked format "+212 06 ·· ·· ·· 42"
- **6 OTP input boxes**: each 46x58px, radius.md, 1.5px border, Fraunces 26px bold, centered
  - Focus: clay border color, clay shadow glow, bg color, -1px translateY
  - Filled: stronger border, bgAlt bg
  - Error: red border, red-tinted bg, shake animation
- Error message: flex row, red bg, icon + text, hidden by default
- Button primary "Vérifier le code" — disabled until all 6 digits filled
- Resend row: "Pas reçu le code?" + "Renvoyer dans 30s" (countdown, disabled until 0)
- "Modifier le numéro" link
- **Success overlay**: full-screen bg overlay, centered card with 80px clay gradient badge (checkmark), "Identité confirmée", "Bienvenue sur Babloo!"

### 7. ForgotPasswordScreen.tsx

- BackHeader with "Récupération"
- Title: "Mot de passe oublié?" (clay-colored question mark)
- Subtitle: "Entrez votre e-mail, nous vous envoyons un lien de réinitialisation"
- Email input
- Error banner
- Success state: green bg card with check icon, "E-mail envoyé!", instructions
- Button: "Envoyer le lien" with loading state

## Guardrails

- **ONLY** modify files in `src/screens/auth/`
- Do NOT modify navigation files — keep same screen names, same navigation params
- Do NOT modify `src/services/` or `src/contexts/` — keep all API calls, auth logic, mutations unchanged
- Do NOT change what data is sent to the API
- Import shared components from `../components` — use Button, Input, ProgressBar, BackHeader, Chip
- All styling uses theme tokens — no hardcoded color strings
- Keep all existing `accessibilityLabel` and `accessibilityRole` props
- SSO buttons are visual stubs — `onPress` shows a toast/alert "Bientôt disponible"
- Keep the existing auth flow logic intact (navigation between screens, form submission, error handling)

## Verification

```bash
cd apps/mobile && npx tsc --noEmit
```
Then visually verify each screen in Expo Go matches the prototype layout.
