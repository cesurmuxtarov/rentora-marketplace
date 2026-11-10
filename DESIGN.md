---
name: Executive Peer-to-Peer Asset Platform
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e18'
  surface-container-low: '#171b26'
  surface-container: '#1c1f2a'
  surface-container-high: '#262a35'
  surface-container-highest: '#313540'
  on-surface: '#dfe2f1'
  on-surface-variant: '#bdc9c6'
  inverse-surface: '#dfe2f1'
  inverse-on-surface: '#2c303b'
  outline: '#889391'
  outline-variant: '#3e4947'
  surface-tint: '#80d5cb'
  primary: '#80d5cb'
  on-primary: '#003733'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#006a63'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#945d00'
  on-tertiary-container: '#ffe6cc'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  display-hero:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.005em
  title-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-numeric:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-badge:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system establishes a high-trust, executive atmosphere tailored for high-value peer-to-peer and business asset leasing. The visual identity bridges institutional fintech rigor with a modern peer-to-peer exchange, evoking security, transparency, and architectural precision.

### Design Movements
- **Dark Architectural Minimalism:** A disciplined foundation built on deep slate structures, eliminating visual clutter to emphasize asset value and transaction details.
- **Micro-Surface Tactility:** Subtle, translucent backdrops with low-contrast borders provide crisp spatial boundaries without heavy skeuomorphism.
- **Data-Dense Precision:** Financial metrics, rental timelines, and identification statuses are framed with crisp tabular figures and high-legibility typographic hierarchies.

## Colors

The palette is engineered for high contrast and institutional authority in a dark canvas environment.

- **Primary (`#0F766E`):** Deep executive teal. Anchors high-priority actions, primary brand assertions, and institutional authentication markers.
- **Secondary (`#10B981`):** Vivid emerald. Used for verified status badges, escrow security clearances, digital contract validations, and positive returns.
- **Tertiary (`#F59E0B`):** Warm amber. Reserved for security deposits, refundable caution holds, insurance caveats, and temporal dispute alerts.
- **Neutral Canvas (`#0B0F19` to `#111827`):** Deep slate and midnight obsidian. Provides structural grounding across all surface depths, avoiding pure `#000000` to maintain ambient optical softness.
- **Surface Borders (`rgba(226, 232, 240, 0.08)` to `rgba(226, 232, 240, 0.16)`):** Controlled micro-borders that articulate panels cleanly against dark tiers.

## Typography

The typographic hierarchy balances structural presence with numerical legibility.

- **Headlines (`Manrope`):** Geometric, solid, and modern. Chosen for its balanced proportions, providing authoritative titling for asset classifications, rental contracts, and profile dashboards.
- **Body & Labels (`Hanken Grotesk`):** Clean, open grotesque tailored for screen legibility. All currency values, fee schedules, and deposit computations must enable tabular numerical properties (`font-variant-numeric: tabular-nums`) to ensure vertical alignment across data lists.
- **Scale Behavior:** Font levels above 24px step down automatically on mobile viewports to prevent line-wrapping artifacts in dense transactional interfaces.

## Layout & Spacing

The layout model utilizes a structured 12-column grid on desktop screens (spanning max-width 1280px), transitioning to an 8-column layout on tablets, and a 4-column layout on mobile viewports.

- **Desktop (>= 1024px):** 12-column grid with a `3rem` section margin and `1.5rem` gutter. Asset previews and financial sidebars adhere to an 8:4 column split.
- **Tablet (768px - 1023px):** 8-column grid with a `2rem` margin and `1.25rem` gutter. Rental summaries collapse below asset galleries.
- **Mobile (< 768px):** 4-column layout with a fixed `1rem` margin and `1rem` gutter. Transaction panels dock permanently to the bottom viewport.
- **Component Rhythms:** Internal padding for cards strictly leverages `space-lg` (`1.5rem`), while micro-elements like transaction chips and state tags use `space-xs` to `space-sm` increments.

## Elevation & Depth

Visual hierarchy within the dark interface avoids harsh dropped shadows, relying instead on stacked tonal surfaces and subtle boundary illumination.

- **Surface Level 0 (Base Canvas):** `#0B0F19` — the foundational background for viewport canvases and non-interactive regions.
- **Surface Level 1 (Card/Container):** `#111827` — primary panels, asset listings, and identity documentation drawers, bordered with `1px solid rgba(226, 232, 240, 0.08)`.
- **Surface Level 2 (Interactive Floating):** `#1E293B` — dropdown menus, transaction sheets, and verification popovers. Augmented with a subtle ambient glow: `box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(226, 232, 240, 0.1)`.
- **Surface Level 3 (Critical Overlays):** `#0F172A` with backdrop-filter `blur(12px)` and border `1px solid rgba(15, 118, 110, 0.3)` for identity verification modals and payment authorizations.

## Shapes

The design system incorporates roundedness level `2` across its visual token architecture:

- **Base Radius (`0.5rem` / `8px`):** Used on standard interactive elements, including input fields, action buttons, state tags, and search bars.
- **Container Radius (`rounded-lg` / `1rem` / `16px`):** Used for asset cards, analytical dashboards, deposit status containers, and escrow summaries.
- **Modal Radius (`rounded-xl` / `1.5rem` / `24px`):** Used for checkout dialogues, national identity document capture sheets, and full-screen overlays.
- **Micro Radius (`0.25rem` / `4px`):** Used for verification badges and inline currency indicators.

## Components

### Buttons
- **Primary Action:** Solid `#0F766E` background with `#FFFFFF` text, `0.5rem` radius, and 44px minimum touch target height. Subtle hover shift to `#115E59`.
- **Secondary / Outline:** `#111827` background, `1px solid rgba(226, 232, 240, 0.16)`, `#F8FAFC` text. Hover state illuminates border with `#0F766E`.
- **Destructive / Caution:** `#18181B` surface with amber outline (`#F59E0B`) for cancellation of active rental contracts or escrow disputes.

### Verification & Identification Badges
- **National ID / Asan İmza State Badge:** Pill-shaped, micro-padding (`space-xs` `space-sm`), text transform uppercase with `label-badge` typography. Background `rgba(16, 185, 129, 0.12)`, text `#10B981`, and a 6px emerald verification dot.
- **Deposit & Caution Indicator:** Background `rgba(245, 158, 11, 0.12)`, text `#F59E0B`, displaying deposit amount and escrow custody status.

### Input Fields & Selectors
- Default container `#111827`, border `1px solid rgba(226, 232, 240, 0.12)`, text `#F8FAFC`, placeholder `#64748B`.
- Focused state transitions border to `#0F766E` with an internal focus ring `box-shadow: 0 0 0 1px #0F766E`.
- Integrated currency prefix (e.g., `₼ AZN`) locked in `Hanken Grotesk` tabular figures.

### Asset Listing Cards
- Border radius `1rem`, surface `#111827`, bordered by `1px solid rgba(226, 232, 240, 0.08)`.
- Image aspect ratio locked to 16:10 with top roundedness conforming to the card. Bottom metadata compartment organizes pricing per day, deposit threshold, and owner identity verification score.

### Lists & Ledger Rows
- Tabular financial rows with alternating border-b `1px solid rgba(226, 232, 240, 0.06)`, maintaining consistent padding across timestamps, contract hashes, asset keys, and settled balances.