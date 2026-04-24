# Platform Human Interface Guidelines — frontend-design

As of April 2026, three distinct design languages ship on the major platforms.
Consult before building native or OS-adjacent apps.

---

## Apple — Liquid Glass

Introduced at WWDC 2025 (9 June 2025). Largest redesign since iOS 7 (2013).
Spans iOS 26, iPadOS 26, macOS 26 "Tahoe", watchOS 26, tvOS 26, visionOS 26
under unified model-year versioning.

Liquid Glass is a "digital meta-material" — translucent, refracts and reflects
underlying content, responds to motion with specular highlights.

Principles:

- **Content leads, controls float** — tab bars shrink when users scroll.
- **Lensing** — light bending through edges.
- **Concentricity** — inner radius = outer radius − padding.
- **Adaptive optics** — material tints from surrounding content, auto-adapts to
  light/dark.
- **Motion as cue** — context menus expand, alerts emerge from tap point.
- **Accessibility first** — Reduce Transparency, Increase Contrast, Reduce
  Motion settings all apply automatically. Do not override.

### Typography

- **SF Pro** (Text ≤19pt, Display ≥20pt, Rounded for friendliness).
- **SF Compact** on watchOS.
- **SF Mono** for code.
- **New York** for serif reading.

Dynamic Type from xSmall to AX5 is mandatory. Use semantic styles (`largeTitle`,
`title1–3`, `headline`, `body`, `callout`, `subheadline`, `footnote`,
`caption1–2`) over hard-coded sizes.

### Colours

Semantic colours (`label`, `secondaryLabel`, `systemBackground`,
`secondarySystemBackground`, `separator`, `link`) adapt across traits.

### Metrics

- Minimum tap target: 44×44 pt on iOS, 60×60 pt on visionOS with 4 pt spacing.
- Status bar: ~54 pt effective on Dynamic Island devices.
- Home indicator: 34 pt reserved.
- Nav bar: 44 pt (96 pt large-title).
- Tab bar: 49 pt (shrinks with scroll on iOS 26).

Refs: https://developer.apple.com/design/human-interface-guidelines

---

## Google — Material 3 Expressive

Announced at Google I/O 2025. Expansion of Material You. Ships with Android 16
and Wear OS 6. Google claims users identify key UI elements up to 4× faster on
expressive layouts.

Adds:

- Physics-based springy motion.
- Richer shape system — 35 new shapes, 10-step corner-radius scale, shape
  morphing.
- 30 emphasised typography variants.
- Stronger contrast, short bottom bars, floating toolbars.

### Dynamic colour

HCT colour space. Extracts from wallpaper or source. Generates five tonal
palettes (primary, secondary, tertiary, neutral, neutral variant) with 13 tones
each. Always pairs roles (`primary`/`onPrimary`, `surface`/`onSurface`) with
guaranteed contrast.

### Type scale

- **Display** — 57 / 45 / 36.
- **Headline** — 32 / 28 / 24.
- **Title**, **Body**, **Label** — each large / medium / small.

### Corner radius scale (dp)

`None 0, XS 4, Sm 8, Md 12, Lg 16, LgIncreased 20, XL 28, XLIncreased 32, XXL 48, Full`.

### Motion

- `standard` curve: `(0.2, 0, 0, 1)`.
- `emphasized` curve for prominent motion.
- Duration tokens: Short1 50 ms → ExtraLong4 1000 ms.
- Spring tokens for gestural response.

### Adaptive layouts

| Window class | Width (dp) | Nav                               |
| ------------ | ---------- | --------------------------------- |
| Compact      | <600       | NavigationBar                     |
| Medium       | 600–839    | NavigationRail                    |
| Expanded     | 840–1199   | NavigationRail / permanent drawer |
| Large        | 1200–1599  | Permanent NavigationDrawer        |
| ExtraLarge   | ≥1600      | Permanent NavigationDrawer        |

Minimum tap target: 48×48 dp.

Refs: https://m3.material.io/

---

## Microsoft — Fluent 2

Ships as Fluent UI React v9, Fluent UI Web Components, and native Apple /
Android libraries.

### Token architecture (cleanest in the industry)

Two layers:

- **Global tokens** — raw values.
- **Alias tokens** — semantic names (`colorBrandBackground1`,
  `colorNeutralForeground1`).

### Typography

**Segoe UI Variable** on Windows with optical sizing. Native system fonts
elsewhere.

### Materials (Windows 11)

| Material | Use                                                    |
| -------- | ------------------------------------------------------ |
| Solid    | Default.                                               |
| Mica     | Opaque, wallpaper-tinted. Primary long-lived surfaces. |
| Acrylic  | Frosted. Transient surfaces only — menus, flyouts.     |
| Smoke    | Modal dim.                                             |

### Metrics

- Stroke widths: Thin / Thick / Thicker / Thickest (1 / 2 / 3 / 4 px).
- Corner radius: None / Small / Medium / Large / XLarge / Circular (0 / 2 / 4 /
  6 / 8 / 9999).
- Spacing scale: 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40.
- Tap target: 40×40 epx.

Refs: https://fluent2.microsoft.design/

---

## When to follow and when to deviate

Follow the platform HIG strongly for:

- Native single-platform apps.
- Apps competing with system apps (mail, calendar, notes, music).
- Enterprise / productivity software.
- Anything leveraging system capabilities (Share Sheet, Siri Shortcuts, Dynamic
  Island, Live Activities, Handoff).

Deviate for:

- Unified cross-platform brands where brand recognition > OS fidelity (Spotify,
  Airbnb, Instagram, Figma, Slack, Linear, Notion).
- Content-canvas pro tools (IDEs, design tools, DAWs).

Non-negotiable even when deviating:

- Native scrolling physics, text selection, input methods (including IME).
- Right-click / long-press context menus.
- Keyboard shortcuts (⌘C/V/X/Z/A/F/N/W/T/S/,).
- Focus rings, back gestures.
- Accessibility APIs.
- Safe areas.
- System-preference queries (dark mode, Reduce Motion, Increase Contrast,
  Dynamic Type).

Web apps have no single platform. Target WCAG 2.2 AA, 44×44 CSS px tap targets,
semantic HTML, responsive breakpoints around 600 / 900 / 1240 px.
