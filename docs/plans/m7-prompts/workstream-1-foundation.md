# Workstream 1: Foundation — Design Tokens + Base Primitives

## Context

You are working on a React Native + Expo 55 mobile app (TypeScript) located in `apps/mobile/`.
The app uses a theme system in `src/theme/` with colors, typography, spacing, and radius tokens.
You need to add shadow tokens and create 10 base UI primitives that all other screens will use.

**Reference:** The HTML prototype at `prototype/Babloo Complete Version.html` is the design spec. Match its CSS values exactly.

## Task

### 1. Add shadow tokens

Edit `apps/mobile/src/theme/spacing.ts` — append these shadow definitions after the `radius` export:

```ts
export const shadows = {
  sm: {
    shadowColor: '#0E1442',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  md: {
    shadowColor: '#0E1442',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0E1442',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 8,
  },
  xl: {
    shadowColor: '#0E1442',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 60,
    elevation: 12,
  },
} as const;
```

Edit `apps/mobile/src/theme/index.ts` — add `shadows` to the re-exports.

### 2. Create primitives in `apps/mobile/src/components/`

Create each component as a separate `.tsx` file. All must:
- Import tokens from `../theme` (colors, spacing, radius, textStyles, shadows, fonts)
- Use `StyleSheet.create` for styles
- Export as named export
- Include TypeScript props interface
- Support accessibility labels where appropriate

#### Button.tsx
- Props: `variant: 'primary' | 'clay' | 'outline' | 'ghost' | 'xs'`, `label: string`, `onPress`, `disabled?`, `icon?: ReactNode`, `loading?: boolean`, `style?`
- Dimensions: height 52px (30px for xs), full-width (auto for xs), borderRadius: radius.full
- Primary: navy bg, white text. Clay: clay bg, white text. Outline: transparent bg, navy text, 1.5px navy border. Ghost: bgAlt bg, navy text. Xs: height 30, fontSize 11, radius.sm, horizontal padding 12
- Font: DM Sans 700 Bold, 15px (11px for xs)
- Active state: opacity 0.85, scale 0.98
- Disabled: opacity 0.35
- Loading: show ActivityIndicator, hide label

#### Card.tsx
- Props: `children`, `style?`
- Background: surface, borderRadius: radius.lg, padding: 18, shadow: shadows.sm

#### Input.tsx
- Props: `value`, `onChangeText`, `placeholder?`, `label?`, `error?`, `secureTextEntry?`, `multiline?`, `numberOfLines?`, `style?`, `inputMode?`
- Container: optional label text above (DM Sans 700 Bold, 12px, navy)
- Input: 1.5px border (border color), radius.md, padding 11px 14px, DM Sans 14px, navy text
- Focus: border color navy
- Error: red error text below, 12px

#### BackHeader.tsx
- Props: `title: string`, `onBack`, `right?: ReactNode`
- Layout: surface bg, borderBottom 1px border, flex row, padding top for safe area
- Back button: 34px circle, bg color, navy chevron icon
- Title: textStyles.h2, flex 1
- Right: optional element (e.g., Chip)

#### Chip.tsx
- Props: `label: string`, `variant: 'default' | 'navy' | 'success' | 'clay' | 'warning'`, `style?`
- Layout: inline-flex, padding 3px 9px, borderRadius: radius.full, 1.5px border
- Font: DM Sans 700 Bold, 10px
- Default: surface bg, border color, textSec text
- Navy: navy 7% bg, navy 14% border, navy text
- Success: successBg bg, success border, success text
- Clay: clayTint bg, clayLight border, clay text
- Warning: warningBg bg, warning border, warning text

#### ProgressBar.tsx
- Props: `progress: number` (0 to 1), `color?: string` (default navy)
- Container: height 4px, borderRadius 2, bg border
- Fill: height 100%, borderRadius 2, bg color, width = progress * 100%

#### Avatar.tsx
- Props: `initials: string`, `size: 'sm' | 'md' | 'lg' | 'xl'`, `variant: 'a' | 'b' | 'c' | 'user'`
- Sizes: sm=32px/11px, md=44px/14px, lg=56px/18px, xl=72px/24px
- Gradients: a = #6C63FF → #A080FF, b = #E8517A → #F07AB0, c = #00A99D → #00D4C8, user = #1C2462 → #2D3494
- Use `expo-linear-gradient` for gradient backgrounds
- Circle shape, centered white bold text

#### Stepper.tsx
- Props: `value: number`, `onIncrement`, `onDecrement`, `min?`, `max?`
- Layout: row with - button, value text, + button, 14px gap
- Buttons: 34px circle, 1.5px border, surface bg, navy text, 18px font
- Value: 22px bold navy, min-width 30, center aligned

#### Toggle.tsx
- Props: `value: boolean`, `onToggle`
- Dimensions: 42x24px, borderRadius 12
- Off: border bg. On: navy bg
- Knob: 18x18, white, 3px from edge, shadow, slides 18px on toggle

### 3. Create barrel export

Create `apps/mobile/src/components/index.ts`:
```ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { BackHeader } from './BackHeader';
export { Chip } from './Chip';
export { ProgressBar } from './ProgressBar';
export { Avatar } from './Avatar';
export { Stepper } from './Stepper';
export { Toggle } from './Toggle';
export { default as NegotiationBar } from './NegotiationBar';
```

## Guardrails

- **ONLY** touch files in `src/theme/` and `src/components/`
- Do NOT modify any screen files in `src/screens/`
- Do NOT modify navigation files in `src/navigation/`
- Do NOT modify service files in `src/services/`
- Do NOT add new npm dependencies unless `expo-linear-gradient` is not already installed (check package.json first)
- All components must compile with `npx tsc --noEmit` without errors
- Preserve the existing `NegotiationBar.tsx` — do not modify it in this workstream

## Verification

After completing, run:
```bash
cd apps/mobile && npx tsc --noEmit
```
Fix any TypeScript errors before marking complete.
