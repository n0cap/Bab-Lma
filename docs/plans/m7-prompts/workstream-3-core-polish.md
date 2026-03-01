# Workstream 3: Core Screens Visual Polish

## Context

You are working on a React Native + Expo 55 mobile app (TypeScript) in `apps/mobile/`.
All core screens exist and are functional. Your job is to **restyle** them to match the HTML prototype without changing business logic, API calls, or navigation structure.

**Reference:** `prototype/Babloo Complete Version.html` — screen IDs: `s-home`, `s-booking-maid`, `s-booking-cuisine`, `s-booking-childcare`, `s-confirm`, `s-orders`, `s-order-detail`, `s-chat`, `s-rating`

**Shared components:** Import from `../components` — Button, Card, Input, BackHeader, Chip, ProgressBar, Avatar, Stepper, Toggle.

**Theme tokens:** Import from `../theme`.

## Screens to Restyle

### 1. HomeScreen.tsx

**Location bar (top, inside surface header):**
- Pill container: bg color, radius.full, padding 10px 16px, 1.5px border
- Left: clay pin icon (SVG), flex column with "ADRESSE DE SERVICE" label + zone name (13px 600 navy)
- Right: chevron down icon (textMuted)
- onPress: open location modal (deferred to WS4 — for now, show a toast)

**Promo banner:**
- Navy gradient card (135deg, navy → #1C2462 60% → #2D1F8A 100%), radius.xl, padding 22px
- Decorative circles: absolute positioned, white 5% opacity border rings
- "OFFRE DE BIENVENUE" label: clayLight, 9px 700 bold, 1.5px letter-spacing
- Title: Fraunces 20px bold white, "Votre 1er service Maid est offert"
- Subtitle: 11px, white 55% opacity
- CTA pill: clay bg, white text, radius.full, 10px 18px padding, arrow icon
- onPress: navigate to ménage booking

**Service grid:**
- Section title: "De quoi avez-vous besoin?" — textStyles.h2
- 3-column grid, 10px gap
- Each card (`svc-card`): surface bg, radius.lg, padding 18px 14px, column layout, shadow.sm, 1.5px border at 6% navy opacity
  - Green dot (7px, absolute top-right) for available services
  - Icon: 52x52 square, radius.md, navy 7% bg, centered SVG icon
  - Label: 12px 600 navy
  - Sub: 10px textMuted
  - Active press: scale 0.97
- Row 1: Ménage, Cuisine, Baby-sitting (all active)
- Row 2: Plomberie, Électricité, Assistance IT (all disabled — 38% opacity, no dot, textMuted label)

**Bottom nav bar:**
- Surface bg, border-top 1px border, padding 8px 6px 20px (safe area)
- 4 items: Accueil, Commandes, Fidèles (stub), Paramètres
- Each: flex column, centered, 6px padding, radius.md
- Icon: 21px SVG, stroke style, textMuted (active: navy)
- Label: 9px 700 bold, textMuted (active: navy)
- Commandes: badge (clay, 15px circle, white 8px text, absolute positioned)
- Fidèles tab onPress: show toast "Fidélisation — bientôt"
- Paramètres: navigates to existing profile screen

### 2. ServiceDetailScreen — Ménage variant

- BackHeader: title "Ménage · Maid", right: Chip navy "Étape 1/3"
- Step indicators: 3 horizontal bars (flex row, 5px gap, 3px height), first filled with clay, others border color
- **Type de prestation** section:
  - Label: t-label "TYPE DE PRESTATION"
  - 2-column grid cards (bk-type-card): surface bg, radius.lg, padding 16px, 2px border
    - Selected: navy border, navy 2% bg
    - Icon: 40px square, radius.sm, bg, centered SVG
    - Title: 13px 700 navy
    - Description: 10px textMuted
    - Price: 11px 700 clay "dès 80 MAD"
  - Card 1: "Ménage simple" — selected by default
  - Card 2: "Ménage profond"
- **Superficie** section:
  - Card with slider (RN Slider or custom): 20-300, accent navy
  - Top: large value display (Fraunces 38px bold) + "m²" suffix + recommendation chip
  - Bottom: "Studio · 20m²" ... "Villa · 300m²" range labels
- **Taille de l'équipe** section:
  - 3 team-cards (flex row, equal flex): Solo, Duo, Squad
  - Each: surface bg, radius.lg, 14px padding, centered, 2px border
  - Selected: navy border, navy 3% bg
  - Content: name (12px 700 navy), sub (10px textMuted), price (11px 700 clay)
- **Estimation prix** — dark price card:
  - Navy gradient bg (135deg navy → navyMid), radius.lg, padding 20px
  - Top row: "PLANCHER MINIMUM GARANTI" label (white 45%, 10px) + price (Fraunces 32px white) + note (11px white 50%)
  - Right box: semi-transparent bg, "Durée estimée" label + duration value
  - Bottom: info bar (white 8% bg, radius.sm, 10px 14px padding, info icon + text)
- **Instructions** section: label + multiline Input
- **CTA bar** (bottom sticky): Button primary "Continuer vers la confirmation" with chevron icon + helper text below

### 3. ServiceDetailScreen — Cuisine variant

- BackHeader: "Préparation culinaire", Chip "Étape 1/3"
- Warning banner: warningBg, 1px warning border at 25%, radius.md, icon + text "Les courses ne sont pas incluses"
- Dishes textarea (Input multiline, 4 rows)
- Guest stepper (Stepper component) inside a Card with price display
- Dark price card (same pattern as ménage)
- CTA: Button primary "Confirmer la demande"

### 4. ServiceDetailScreen — Childcare variant

- BackHeader: "Garde d'enfants", Chip "Étape 1/3"
- Children stepper in Card + "min. par enfant" label + "80 MAD" price
- Hours stepper in Card + "Total estimé" label + computed price
- Notes textarea
- Dark price card
- CTA: Button primary "Confirmer la demande"

### 5. OrderConfirmScreen.tsx

- BackHeader: "Récapitulatif", Chip navy "Étape 2/3", back goes to appropriate booking screen
- **Recap card**: Card with:
  - Header: "SERVICE COMMANDÉ" label, title (h2), subtitle, optional clay chip for first order
  - Divider
  - Detail rows: label (13px textSec) — value (13px 600 navy), right-aligned
  - Rows: Type, Superficie/Convives/Enfants, Équipe, Durée, Adresse, Paiement
- **Price block**: navy bg, radius.lg, 18px padding
  - "PLANCHER MINIMUM" label + large price (Fraunces 28px white) + "Prix final négocié via le chat" note
  - Right: chat icon with "Négociation" sub
- **Next steps**: bgAlt section, h3 title, 4 numbered steps (24px navy circle with white number + description text)
- **CTA bar**: Button clay "Confirmer et lancer la recherche" + helper text

### 6. OrdersListScreen.tsx

- Header: "Mes commandes" (h1), logo icon right-aligned
- Scrollable list of order cards (existing data)
- Bottom nav bar (same as home)

### 7. OrderDetailScreen.tsx

- BackHeader with title + status Chip
- Scrollable detail content (existing layout, just restyle to match card/chip patterns)

### 8. ChatScreen.tsx

- Header: BackHeader with Avatar (md), name (14px 700 navy), role + "En ligne" (11px textMuted), Chip success "Négociation"
- Chat area: scrollable, 16px 20px padding, column layout with 12px gap
- Message bubbles: existing logic, restyle to match (client right-aligned navy bg, pro left-aligned surface bg with border)
- Negotiation panel: restyle NegotiationBar.tsx to match prototype slider style
- Input bar: bottom sticky, surface bg, border-top, row layout: camera icon + Input (radius.full) + mic icon

### 9. RatingScreen.tsx

- Header: "Prestation terminée" (h1) + subtitle
- **Star rating**: Card with label + 5 star SVGs (32px each), filled = navy, empty = #D8D7EE, tappable
- **Comment**: Card with label + textarea (no border, just padding)
- **Tip grid**: Card with label + 4-column grid of tip buttons (dashed clay border, clayTint bg)
- **Fidélisation teaser**: navy gradient card with "NOUVEAU · FIDÉLISATION" label, title, subtitle, avatar row — but CTA shows toast "Bientôt" instead of navigating
- **CTA bar**: two buttons row: "Fidéliser l'équipe" ghost (shows toast) + "Terminer" primary

## Guardrails

- **ONLY** modify files listed in the screens above + `src/components/NegotiationBar.tsx`
- Do NOT modify navigation files
- Do NOT modify `src/services/`, `src/contexts/`, or any API/mutation logic
- Do NOT change data fetching, query keys, or mutation calls
- Keep all existing `accessibilityLabel` and `accessibilityRole` props
- Import shared components from `../components`
- All colors/fonts/spacing from theme tokens — no hardcoded values
- The bottom nav bar should be extracted as a shared component IF it's identical across Home, Orders, and Fidèles screens — otherwise inline it

## Verification

```bash
cd apps/mobile && npx tsc --noEmit
```
Then visually verify in Expo Go that each screen matches the prototype.
