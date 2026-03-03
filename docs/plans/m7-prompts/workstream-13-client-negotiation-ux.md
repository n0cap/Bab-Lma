# WS13 — Client Negotiation UX Polish

## Goal
Fix the NegotiationBar layout in ChatScreen so it doesn't scroll, scales properly on small screens, and doesn't block message history when the keyboard opens.

---

## Context

### Current state
- **ChatScreen.tsx** layout hierarchy:
  ```
  KeyboardAvoidingView (flex: 1, behavior: 'padding' on iOS)
    BackHeader
    View (headerMetaWrap - counterparty info)
    FlatList (messages, style: { flex: 1 })
    ScrollView (negotiationScroll, maxHeight: 340, nestedScrollEnabled)
      NegotiationBar
    View (inputRow)
  ```
- **NegotiationBar.tsx** is a flat `View` (not scrollable itself) containing:
  - Optional pending offer box
  - Floor price display + proposition delta
  - Hero amount (28px)
  - Slider (@react-native-community/slider)
  - Range labels
  - 4 preset buttons (Plancher, +10%, +20%, +30%)
  - Manual input row
  - Info disclaimer
  - "Proposer X MAD" button
- The NegotiationBar is **wrapped in a ScrollView** with `maxHeight: 340` — this makes it scrollable, which the user doesn't want
- `KeyboardAvoidingView` has `keyboardVerticalOffset={0}` — may cause NegotiationBar to cover messages when keyboard opens
- Input row has `paddingBottom: 28`

### Problems identified
1. NegotiationBar is scrollable (inside `ScrollView`) — user wants it non-scrollable
2. On small screens the NegotiationBar could be too tall to fit
3. When keyboard opens, NegotiationBar may push messages out of view or block them
4. Message history should remain visible during negotiation + keyboard open

---

## Implementation

### 1. Remove ScrollView wrapper from NegotiationBar

**File:** `apps/mobile/src/screens/chat/ChatScreen.tsx`

Replace the `ScrollView` wrapper around `NegotiationBar` with a plain `View`:

```tsx
// BEFORE (scrollable - remove this)
<ScrollView style={styles.negotiationScroll} nestedScrollEnabled>
  <NegotiationBar ... />
</ScrollView>

// AFTER (non-scrollable)
{isNegotiating && order && (
  <NegotiationBar ... />
)}
```

Remove the `negotiationScroll` style from the StyleSheet.
Remove `ScrollView` from imports if no longer used elsewhere in the file.

### 2. Make NegotiationBar compact and responsive

**File:** `apps/mobile/src/components/NegotiationBar.tsx`

Redesign the NegotiationBar to be more compact so it fits on small screens without scrolling:

**Compact layout (top to bottom):**
1. **Pending offer row** (if exists) — keep as-is, this is important
2. **Hero amount** — the current amount, large text (keep 28px but reduce vertical padding)
3. **Slider** — keep full width, reduce vertical margins
4. **Range row** — floor / ceiling labels (keep)
5. **Preset buttons** — 4 in a row (reduce padding, make smaller)
6. **"Proposer X MAD" button** — full width, primary action

**Remove from compact layout:**
- Manual input row (remove — the slider + presets are sufficient)
- Info disclaimer bar (remove — clutters the UI)
- Floor price label + proposition delta at the top (redundant with hero amount)

This should bring the NegotiationBar height to roughly **~200px** instead of ~340px.

**Add responsive scaling:**
```tsx
import { Dimensions } from 'react-native';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
```

If `SCREEN_HEIGHT < 700` (small devices), reduce:
- Hero amount fontSize: `28` → `24`
- Slider height: `32` → `28`
- Preset button padding
- Overall container paddingVertical

### 3. Fix keyboard behavior in ChatScreen

**File:** `apps/mobile/src/screens/chat/ChatScreen.tsx`

Adjust `KeyboardAvoidingView` offset so messages stay visible when keyboard + NegotiationBar are both showing:

```tsx
<KeyboardAvoidingView
  style={styles.flex}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
>
```

The `keyboardVerticalOffset` of `90` accounts for the header height so the messages FlatList shrinks properly when the keyboard opens.

Also ensure the FlatList has `inverted={false}` (default) and messages scroll to bottom when new messages arrive — the `scrollToEnd` logic should work with the keyboard.

### 4. Ensure message visibility during negotiation

**File:** `apps/mobile/src/screens/chat/ChatScreen.tsx`

The FlatList (messages) already has `style={{ flex: 1 }}` which is correct — it will shrink when the NegotiationBar takes space below it. With the compact NegotiationBar (~200px) + keyboard, the FlatList should still have enough room to show 2-3 messages.

If the NegotiationBar + keyboard would take more than 70% of screen height, consider:
- Auto-collapsing the NegotiationBar to just show the "Proposer" button + hero amount
- Expanding on tap to show full slider/presets

**Implementation:** Use `Keyboard` API to detect keyboard state:
```tsx
import { Keyboard } from 'react-native';
const [keyboardVisible, setKeyboardVisible] = useState(false);

useEffect(() => {
  const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
  const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
  return () => { showSub.remove(); hideSub.remove(); };
}, []);
```

When `keyboardVisible && isNegotiating`:
- Collapse NegotiationBar to minimal view (just hero amount + "Proposer" button)
- Full NegotiationBar returns when keyboard hides

---

## File ownership

| File | Action | Owner |
|------|--------|-------|
| `apps/mobile/src/screens/chat/ChatScreen.tsx` | MODIFY — remove ScrollView wrapper, fix KeyboardAvoidingView offset, add keyboard-aware collapse | WS13 |
| `apps/mobile/src/components/NegotiationBar.tsx` | MODIFY — compact layout, remove manual input/disclaimer, responsive sizing | WS13 |

### DO NOT TOUCH
- `apps/api/src/routes/negotiation.routes.ts` (no API changes)
- `apps/api/src/services/negotiation.service.ts` (no logic changes)
- `apps/api/src/socket/handlers.ts` (no socket changes)
- `apps/mobile/src/screens/pro/` (pro screens)
- `apps/mobile/src/services/` (no hook changes)
- Any other screen files

---

## Acceptance criteria

1. NegotiationBar is NOT inside a ScrollView — it renders as a fixed-height block
2. NegotiationBar fits on screens as small as 667px height (iPhone SE) without overflowing
3. When keyboard opens during negotiation, older messages remain visible (at least 2-3 messages)
4. NegotiationBar auto-collapses to minimal view when keyboard is open
5. NegotiationBar expands back when keyboard closes
6. Slider, presets, and "Proposer" button all work correctly
7. Pending offer display + "Accepter" button still work
8. Manual price input field is removed (slider + presets are sufficient)
9. Info disclaimer is removed
10. `npx tsc --noEmit --project apps/api/tsconfig.json` passes with zero errors
