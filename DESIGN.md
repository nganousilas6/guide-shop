# Design Brief

## Direction

Kiosk Pop — a mobile-first retail-reward kiosk: white shopping-floor content, black chrome rails, and an electric cyan call to action.

## Tone

Playful-commerce with editorial discipline: warm tangerine hero energy up top, then a calm white catalog below and a hard black navigation rail — confident, never cute.

## Differentiation

The black-chrome frame: a solid black header and bottom rail sandwich a bright white content floor, so cyan CTAs and red commission figures read like price tags on a shop window.

## Color Palette

| Token      | OKLCH        | Role                                                |
| ---------- | ------------ | --------------------------------------------------- |
| background | 1 0 0        | Clean white content floor                           |
| foreground | 0.16 0.012 265 | Near-black ink for headings and body              |
| card       | 1 0 0        | White card surface with hairline border             |
| primary    | 0.72 0.14 205 | Electric cyan CTAs, active nav, progress            |
| accent     | 0.78 0.16 68  | Warm tangerine hero gradient, highlights            |
| muted      | 0.965 0.006 220 | Section fill, input wells, dividers              |
| secondary  | 0.19 0.012 265 | Black chrome rail, icon tiles, pill buttons       |
| destructive | 0.52 0.2 24 | Commission and withdrawal figures in financial red  |
| stat       | 0.965 0.035 200 | Cyan-tinted 2x2 statistics surface               |

## Typography

- Display: Space Grotesk — app title, VIP level, section headings, money figures
- Body: Plus Jakarta Sans — labels, inputs, chat, card copy
- Scale: hero `text-2xl font-bold tracking-tight`, h2 `text-lg font-semibold`, label `text-[11px] font-semibold tracking-widest uppercase`, body `text-sm`, money `text-xl font-bold tabular-nums`

## Elevation & Depth

Flat white floor with hairline `border` cards; depth comes from `shadow-card` on list rows, `shadow-cta` under cyan buttons, and a `shadow-chrome` lift above the black bottom rail.

## Structural Zones

| Zone    | Background            | Border            | Notes                                                        |
| ------- | --------------------- | ----------------- | ------------------------------------------------------------ |
| Header  | `bg-secondary` black  | none              | Title centered, menu left, language globe right, white glyphs |
| Hero    | `bg-hero-gradient`    | none              | Tangerine gradient band with floating 3D-commerce illustration |
| Content | `bg-background` white | —                 | Sections alternate `bg-muted/40`; centered titles on hairline rules |
| Footer  | `bg-secondary` black  | none              | Fixed 5-tab rail, cyan active tab, `shadow-chrome`           |

## Spacing & Rhythm

Mobile-first single column, `px-4` gutters, `space-y-6` between sections, `gap-3` inside card grids, generous `py-5` card padding; content clears the fixed rail with `pb-24`.

## Component Patterns

- Buttons: cyan `rounded-full` full-width CTAs with white bold text and `shadow-cta`; black pill secondary; outline pill for Retrait; press scale 0.98
- Cards: `rounded-2xl` white with hairline border and `shadow-card`; stat card uses cyan-tinted `bg-stat`
- Badges: `rounded-full` VIP chips — cyan for VIP1+, black for VIP0; red text for commission deltas
- Inputs: `rounded-xl` with `border-input`, `bg-muted/50` well, cyan focus ring
- Nav: black rail, icon over 10px label, active tab cyan with cyan dot indicator

## Motion

- Entrance: `animate-fade-up` staggered 40ms across list rows; `animate-pop-in` for modals
- Hover: `transition-smooth` color and lift; buttons scale to 0.98 on press
- Decorative: `animate-float-soft` on hero illustration; `animate-shimmer` on loading skeletons

## Constraints

- Light mode only — the black chrome rails supply the contrast, no dark theme
- Money always rendered as `1 234,56 FCFA` with tabular numerals; never a bare number
- No purple gradients, no glassmorphism, no neon glow shadows
- Every screen is single-column mobile-first; the rail is the only fixed element
- All copy is bilingual FR/EN through the language switcher; FR is the default

## Signature Detail

The black-chrome sandwich — solid black top bar and bottom rail framing a white floor, with the cyan active tab as the single brightest pixel on the screen.
