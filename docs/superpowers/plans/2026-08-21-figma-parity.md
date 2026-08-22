# Figma MVP parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make every style in `smalsuolis-web` match the Figma MVP file exactly —
no approximations, no "close enough" values.

**Architecture:** Fix shared tokens first (type scale, colours), because a single
wrong token repeats on every screen. Then correct per-component geometry
top-down: navbar → homepage sections → auth'd pages. Each task ends by
re-measuring the live DOM against the reference and comparing numbers.

**Tech Stack:** React 18, styled-components 6, Vite, `@aplinkosministerija/design-system`.

**Spec:** `figma-reference/DESIGN_TOKENS.md` — every number in this plan is copied
from there, which in turn came from the Figma REST JSON tree.

## Global Constraints

- Values are exact. `-0.05em`, not `-0.04em`; `#000000`, not `#101010`.
- Figma `letterSpacing` is **px**; the `typography` map stores **em**
  (`ls_px / fontSize`).
- Desktop reference frame is **1440** wide, mobile **393**.
- No new abstractions. Edit the existing styled-components in place.
- Content width stays `1392px` + `32px` padding — that already yields the
  Figma 1328px content box. Do not change it.
- Verify by re-measuring `getComputedStyle` at 1440px in the running app
  (`http://localhost:5174`), not by eyeballing a screenshot.

---

### Task 1: Type scale letter-spacing and mobile heading weight

**Files:**

- Modify: `src/styles/index.ts:112-120` (the `typography` map)

**Interfaces:**

- Produces: corrected `typography` tokens consumed via `font(token, weight?)`
  by every component in later tasks.

- [ ] **Step 1: Replace the tracking values**

```ts
export const typography = {
  '6xl': { size: 6.4, lineHeight: 1.2, weight: 700, tracking: '-0.05em' },
  '5xl': { size: 4.8, lineHeight: 1.5, weight: 400, tracking: '-0.05em' },
  '3xl': { size: 3.0, lineHeight: 1.3, weight: 500, tracking: '-0.05em' },
  '2xl': { size: 2.4, lineHeight: 1.3, weight: 500, tracking: '-0.02em' },
  xl: { size: 2.0, lineHeight: 1.5, weight: 400, tracking: '-0.02em' },
  lg: { size: 1.8, lineHeight: 1.5, weight: 400, tracking: '-0.02em' },
  base: { size: 1.6, lineHeight: 1.5, weight: 400, tracking: '-0.02em' },
} as const;
```

- [ ] **Step 2: Verify in the browser**

At 1440px on `/`, the `h1` must report `letter-spacing: -3.2px` (was −1.28px)
and each `h2` `-1.5px`.

- [ ] **Step 3: Commit**

```bash
git add src/styles/index.ts
git commit -m "fix(styles): match Figma letter-spacing across the type scale"
```

---

### Task 2: Core colours

**Files:**

- Modify: `src/styles/index.ts` — `colors.text.primary`, `colors.background`,
  `colors.grey`

- [ ] **Step 1: Set text primary to the Figma black**

`text.primary: '#000000'` (was `#101010`).

- [ ] **Step 2: Set the page background to white**

`background: '#FFFFFF'` (was `#f7f7f7`). `GREY` and `cardBackground.primary`
keep `#f7f7f7` — they are card fills, not the page.

- [ ] **Step 3: Add the missing muted grey**

Add `550: '#818181'` to the `grey` ramp, between `500` and `600`.

- [ ] **Step 4: Verify**

`document.body` background must read `#FFFFFF`; every heading `#000000`.

- [ ] **Step 5: Commit**

```bash
git add src/styles/index.ts
git commit -m "fix(styles): use Figma black, white page background, add grey-550"
```

---

### Task 3: Navbar height, background and divider

**Files:**

- Modify: `src/components/DefaultLayout/TopNav.tsx:150` (height), and the
  wrapper that renders the bar on inner pages

- [ ] **Step 1: Set the desktop height to 80px**

`height: 80px;` (was 72px). Mobile stays 64px until Task 9 re-measures it.

- [ ] **Step 2: Give inner pages the white bar and divider**

On every route except `/` and `/apie-mus`, the bar gets
`background: #FFFFFF; border-bottom: 1px solid ${theme.colors.grey[300]};`
(`grey[300]` is `#DDDDDD`). Over the hero it stays transparent, borderless.

- [ ] **Step 3: Add the missing Prenumeratos link**

Nav order must be Pagrindinis · Žemėlapis · **Prenumeratos** · Statistika ·
Apie mus. Show it only when a user is logged in if the route is guarded;
otherwise always.

- [ ] **Step 4: Verify**

Nav is `1440x80`; on `/statistika` its wrapper reports
`border-bottom: 1px solid #DDDDDD` and `background: #FFFFFF`.

- [ ] **Step 5: Commit**

```bash
git add src/components/DefaultLayout/TopNav.tsx
git commit -m "fix(nav): 80px bar, white background and divider on inner pages"
```

---

### Task 4: Hero search card and inputs

**Files:**

- Modify: `src/components/home/HeroSearch.tsx:116,158,194-202,217-224,235-243,253`

- [ ] **Step 1: Correct the card**

```
max-width: 1312px;   /* was 1152px */
border-radius: 28px; /* was 24px  */
padding: 42px;       /* was 16px  */
gap: 10px;           /* was 12px  */
border: 1px solid #D4D3D3;  /* was absent */
```

- [ ] **Step 2: Give the address field its pill outline on desktop**

`height: 56px; border: 1px solid ${theme.colors.grey[500]}; border-radius: 44px;
padding: 0 16px;` — currently these exist only inside `@media ${device.mobileL}`.

- [ ] **Step 3: Fix the two control widths**

Sritys select `width: 300px` (was `min-width: 200px`);
Ieškoti button `width: 170px` (was auto → 98px).

- [ ] **Step 4: Correct the intro paragraph colour**

`color: ${({ theme }) => theme.colors.grey[550]};` — `#818181`, was `#BCBCBC`.

- [ ] **Step 5: Mobile hero green and heading weight**

Line 116 `background: #7eec9b;` (was `#92e9ac`). Keep dropping the artwork.
Line 158 `${font('3xl', 800)};` (was `font('3xl')` → w500).

- [ ] **Step 6: Verify**

Card measures `1312x140` with `border-radius: 28px` and `padding: 42px`;
Ieškoti is `170x56`; Sritys `300x56`.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/HeroSearch.tsx
git commit -m "fix(home): hero search card, input pills and mobile hero to Figma"
```

---

### Task 5: Stat row

**Files:**

- Modify: `src/components/home/StatRow.tsx:55,66,92`

- [ ] **Step 1: Correct the spacing and label colour**

Row `gap: 112px` (was 24px); number↔label `gap: 0` (was 8px);
label `color: ${({ theme }) => theme.colors.text.primary}` — `#000000`,
was `grey[600]` `#707070`.

- [ ] **Step 2: Verify**

Four blocks 112px apart; label renders `#000000`.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/StatRow.tsx
git commit -m "fix(home): stat row spacing and label colour to Figma"
```

---

### Task 6: Category pills

**Files:**

- Modify: `src/components/home/CategoryBrowse.tsx:112,118-121`

- [ ] **Step 1: Correct pill geometry**

```
/* row */      gap: 16px;              /* was 12px */
/* pill */     gap: 14px;              /* was 10px */
               padding: 8px 12px;      /* was 8px 16px 8px 8px */
               border-radius: 39px;    /* was 100px */
               height: 43px;
```

- [ ] **Step 2: Verify**

Pill measures 43px tall with `border-radius: 39px`; row gap 16px.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/CategoryBrowse.tsx
git commit -m "fix(home): category pill geometry to Figma"
```

---

### Task 7: Event rows

**Files:**

- Modify: `src/components/home/RecentEvents.tsx:121-122,134,145,149-164`

- [ ] **Step 1: Correct row spacing**

`padding: 0 0 32px;` (was `24px 0`); row inner `gap: 22px` (was 24px);
list `gap: 32px` (was 24px). Keep `border-bottom: 1px solid ${grey[400]}`
(`#D6D6D6`); the last row has none.

- [ ] **Step 2: Correct the typography**

```
title:    ${font('2xl')};  color: ${theme.colors.grey[700]};  /* 24px w500 #333333 */
location: ${font('xl')};   color: ${theme.colors.grey[700]};  /* 20px      #333333 */
date:     ${font('xl')};   color: ${theme.colors.grey[700]};
dot:      color: ${theme.colors.grey[400]};                   /* #D6D6D6 */
```

Was: title `font('lg', 700)` + `text.primary`; location/date `font('base')` +
`grey[600]`; dot `grey[500]`.

- [ ] **Step 3: Verify**

Title reports `24px/31.2 w500 #333333`; location `20px/30 #333333`.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/RecentEvents.tsx
git commit -m "fix(home): event row spacing and typography to Figma"
```

---

### Task 8: CTA cards

**Files:**

- Modify: `src/components/home/CtaCards.tsx:65,82,103-104,118`

- [ ] **Step 1: Correct the radii**

`border-radius: 20px` on the band; `0 20px 20px 0` on the image panel;
`20px 0 0 20px` on the dark panel. All three were 32px.

- [ ] **Step 2: Correct the content column**

Column `gap: 40px` between the text block and the button; text block `gap: 20px`
(was a single `gap: 16px`). Body copy `color: ${theme.colors.white}`
(was `grey[400]` `#D6D6D6`).

- [ ] **Step 3: Correct the button**

`width: 420px; height: 56px; padding: 8px 24px;` (was auto → 478x64, pad 16/32).

- [ ] **Step 4: Verify**

Panels report `border-radius: 20px`; button `420x56`; body copy `#FFFFFF`.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/CtaCards.tsx
git commit -m "fix(home): CTA card radii, spacing and button to Figma"
```

---

### Task 9: Profilis form

**Files:**

- Modify: `src/pages/Profile.tsx`, `src/components/UserForm.tsx`

- [ ] **Step 1: Correct the column**

`width: 599px` centred; title→form `gap: 37px`; form inner `gap: 29px`;
field `gap: 24px`.

- [ ] **Step 2: Replace the design-system field styling**

The fields currently render the old DS default (`border-radius: 4px`,
`border: 1px solid #D4D5DE`). Override to:

```
label:   ${font('base')}; color: ${theme.colors.text.primary};  /* 16px #000000 */
control: height: 40px;
         background: ${theme.colors.white};
         border: 1px solid ${theme.colors.grey[500]};   /* #BCBCBC */
         border-radius: 100px;
         padding: 0 12px;
placeholder: color: ${theme.colors.grey[500]};
```

- [ ] **Step 3: Correct the submit button**

`width: 141px; height: 40px; padding: 8px 24px; border-radius: 54px;
background: #000000;` text `${font('base')}` white.

- [ ] **Step 4: Verify**

Column measures 599px at x=421; a field control is 40px tall with
`border-radius: 100px` and `border-color: #BCBCBC`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Profile.tsx src/components/UserForm.tsx
git commit -m "fix(profile): form column, field pills and button to Figma"
```

---

### Task 10: Prenumeratos heading, button and rows

**Files:**

- Modify: `src/pages/Subscriptions.tsx`, `src/components/SubscriptionRow.tsx`

- [ ] **Step 1: Route the heading through the type scale**

`${font('3xl')}` + `color: ${theme.colors.text.primary}` — 30px/1.3 w500
`-0.05em` `#000000`. It currently renders 32px, `line-height: normal`,
`letter-spacing: normal`.

- [ ] **Step 2: Correct the button**

`width: 165px; height: 40px; padding: 8px 24px; border-radius: 54px;
background: #000000; gap: 4px;` (was 161x48, `r=24`, `#1A1A1A`).

- [ ] **Step 3: Correct the rows**

`padding: 0 0 24px; gap: 24px; border-bottom: 1px solid ${grey[400]};`
Note these differ from the homepage rows (32/22) — that is intentional in Figma.

- [ ] **Step 4: Verify**

Log in, create one subscription, then measure: heading `30px/39 w500 -1.5px`,
button `165x40 r=54 #000000`, row padding-bottom 24.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Subscriptions.tsx src/components/SubscriptionRow.tsx
git commit -m "fix(subscriptions): heading, button and row metrics to Figma"
```

---

### Task 11: Mobile reference and mobile parity

**Files:**

- Modify: `figma-reference/DESIGN_TOKENS.md` (add a mobile section)
- Modify: whichever components the diff turns up

- [ ] **Step 1: Extract the 393px reference**

```bash
python3 figma-reference/spec.py Homepage Homepage --depth=4
python3 figma-reference/spec.py Prenumeratos "Prenumeratos mobile" --depth=4
python3 figma-reference/spec.py Profilis "Profilis mobile" --depth=4
```

Record each frame's measured values in `DESIGN_TOKENS.md` under a
`## Mobile (393)` heading.

- [ ] **Step 2: Measure the app at 393px**

Resize to 393x850 and re-run the computed-style dump on `/`, `/prenumeratos`,
`/profilis`.

- [ ] **Step 3: Fix the diffs**

Apply the same value-by-value corrections as Tasks 4–10, inside
`@media ${device.mobileL}`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix(mobile): align 393px breakpoint with Figma"
```

---

### Task 12: Full re-measure

**Files:** none — verification only.

- [ ] **Step 1: Re-measure every flow at 1440 and 393**

`/`, `/zemelapis`, `/visos-naujienos`, `/statistika`, `/apie-mus`,
`/prenumeratos`, `/profilis`, `/prisijungimas`.

- [ ] **Step 2: Diff against `DESIGN_TOKENS.md`**

Every value must match. Record any remaining delta with its Figma node id
rather than silently accepting it.

- [ ] **Step 3: Run the quality gate**

```bash
yarn lint && yarn build
```

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "chore: Figma parity verified across all flows"
```
