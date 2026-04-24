# Design canon — frontend-design

Depth reference. Load when the task calls for reasoning about _why_ the rules in
`SKILL.md` hold, or when citing a specific designer, book, or movement.

---

## The Swiss tradition

The Swiss International Typographic Style emerged at the Kunstgewerbeschule
Zürich and Schule für Gestaltung Basel in the 1940s–1950s. Doctrine:

- Grid-based layouts.
- Sans-serif typography (Akzidenz-Grotesk, then Helvetica and Univers, both
  released 1957).
- Asymmetric composition balanced by tension.
- Flush-left, ragged-right text.
- Photographic objectivity.
- Mathematical proportion.

Key figures:

- **Josef Müller-Brockmann** (1914–1996), _Grid Systems in Graphic Design_
  (Niggli, 1981). Construction sequence: format → type area → typeface and
  leading → column width from optimal measure → grid fields with blank rows →
  align everything. Translates directly to digital: viewport breakpoints, 8 or
  12 columns, gutters and margins from a base unit, leading as baseline grid,
  snap every element to it.
  https://niggli.ch/en/product/grid-systems-in-graphic-design/
- **Max Bill** (Hochschule für Gestaltung Ulm, 1953).
- **Armin Hofmann**, _Graphic Design Manual_ (1965).
- **Emil Ruder**, _Typographie: A Manual for Design_ (1967).
- **Karl Gerstner**, _Designing Programmes_ (1964) — direct ancestor of
  design-systems thinking.

The **8-point grid system** (popularised 2017 by Elliot Dahl; adopted by Google
Material, IBM Carbon, Ant Design, Airbnb) is the pragmatic web implementation.

---

## Bauhaus and its heirs

The Bauhaus (Weimar 1919 → Dessau 1925 → Berlin 1932, closed 1933) under
Gropius, Hannes Meyer, then Mies van der Rohe. Form follows function, unity of
art and craft, geometric abstraction, primary colours, mass production.

- Moholy-Nagy drove typographic modernisation.
- Herbert Bayer's Universal typeface (1925) was the first geometric single-case
  sans.
- Josef Albers's _Interaction of Color_ (1963) — same colour reads differently
  depending on its neighbour. Test every token in context.
- Jan Tschichold, _Die neue Typographie_ (1928) — asymmetric modernist layout
  with flush-left sans-serif.

Post-war descendants:

- **Paul Rand** — IBM 1956, ABC 1962, UPS 1961, NeXT 1986. "Present one
  solution, not many."
- **Saul Bass** — film titles (_The Man with the Golden Arm_ 1955, _Vertigo_
  1958, _Psycho_ 1960), corporate identity (AT&T 1983, Continental 1968, United
  1974). "Symbolize and summarize."
- **Massimo Vignelli** — NYC Subway 1972, American Airlines 1967, Unigrid
  National Park System 1977. _The Vignelli Canon_ (2010, free PDF at
  https://www.vignelli.com/canon.pdf) — "roughly five typefaces is sufficient"
  (Bodoni, Garamond, Helvetica, Century Expanded, Futura, Times Roman).

---

## Rams's ten principles

Articulated late 1970s at Braun (1955–1995). Quoted from
https://www.vitsoe.com/us/about/good-design :

1. Good design is innovative.
2. Good design makes a product useful.
3. Good design is aesthetic.
4. Good design makes a product understandable.
5. Good design is unobtrusive.
6. Good design is honest.
7. Good design is long-lasting.
8. Good design is thorough down to the last detail.
9. Good design is environmentally-friendly.
10. Good design is as little design as possible. _Less, but better._

Lineage: Rams's 606 shelving for Vitsœ (1960) still ships; Jony Ive named Rams
as the primary influence on Apple's industrial design; the iPod echoes the Braun
T3 pocket radio (1958).

Operational filter: every design choice should pass Principle 10. Can this be
removed without losing meaning?

---

## Scandinavian and Japanese adjacent traditions

When the Swiss grid turns clinical, borrow warmth:

**Scandinavian** — Alvar Aalto, Arne Jacobsen, Poul Henningsen, Hans Wegner,
Verner Panton. Functionalism softened by natural materials, blonde wood, diffuse
light. Concepts: **hygge** (Danish coziness), **lagom** (Swedish "not too much,
not too little"). IKEA's **Democratic Design** (form, function, quality,
sustainability, low price) is the mass-market heir.

**Japanese minimalism**:

- **Ma** — the pregnant interval. Treat whitespace as substance, not absence.
- **Wabi-sabi** — beauty in imperfection.
- **Kenya Hara** (MUJI): "white is a colour from which colour has escaped, but
  its diversity is boundless" (_White_, 2009).
- **Naoto Fukasawa** and **Jasper Morrison**, _Super Normal_ (2006) — the best
  designs become almost invisible through habitual use. Target that.

---

## Typography anatomy and classification

Anatomy vocabulary: x-height, cap height, ascender/descender, counter, bowl,
stem, terminal, aperture, stress, serif, bracket, ligature, overshoot.

Vox-ATypI classification:

| Family              | Examples                                                     |
| ------------------- | ------------------------------------------------------------ |
| Old Style / Garalde | Garamond (1530s), Caslon (1722)                              |
| Transitional        | Baskerville (1757), Times New Roman (1931)                   |
| Modern / Didone     | Bodoni (1798), Didot (1784)                                  |
| Slab Serif          | Clarendon, Rockwell, IBM Plex Serif                          |
| Grotesque           | Akzidenz-Grotesk (1896)                                      |
| Neo-grotesque       | Helvetica (1957), Univers (1957), Inter (2017), Söhne (2019) |
| Geometric           | Futura (1927), Avenir, Gotham (2000)                         |
| Humanist            | Gill Sans, Frutiger, IBM Plex Sans, SF Pro                   |

### Canonical screen sans-serifs

- **Inter** (Rasmus Andersson, 2017, SIL OFL) — era-defining UI typeface. Tall
  x-height, open apertures, ink-traps, variable weight 100–900, optical sizing,
  tabular numbers, slashed zero. https://rsms.me/inter/
- **Geist** / **Geist Mono** (Vercel × Basement Studio). Free. Swiss-descended;
  draws from Univers, SF Mono, SF Pro, Inter, Suisse International.
  https://vercel.com/font
- **Söhne** / **Söhne Mono** (Kris Sowersby, Klim Type Foundry, 2019).
  Commercial. "The memory of Akzidenz-Grotesk framed through the reality of
  Helvetica." Common across high-craft brand systems.
  https://klim.co.nz/retail-fonts/soehne/
- **IBM Plex** (Mike Abbink, 2017, open-source). Preferred neutral superfamily
  for generic ABP product/tool UI when no stronger brand, platform, or
  jurisdictional type system applies. Use Plex Sans for interface text, Plex
  Mono for code/technical values, and Plex Serif for editorial or long-form
  explanation. https://www.ibm.com/plex/
- **SF Pro** (Apple, 2015) — Apple platform default.
  https://developer.apple.com/fonts/

For system stacks with no brand font:
`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", Arial, sans-serif`

Bringhurst's body measure (45–75 chars, 66 ideal) comes from _The Elements of
Typographic Style_ (1992).
https://www.goodreads.com/book/show/44735.The_Elements_of_Typographic_Style

---

## Colour depth

### Itten's wheel and harmonies

Monochromatic, analogous (30°), complementary (180°), split-complementary,
triadic (120°), tetradic, square.

For UIs, ignore the painter's wheel. Ship a **10-step neutral grey ramp + one
accent + semantic success/warning/error/info**. Six colours of intent.

### Dark mode specifics

- Never pure `#000`. Halation and shadow invisibility make it harsh. Use
  `#0A0A0A` or `#0D0E12`.
- Elevated surfaces: small white overlays (Material uses 0%→16% opacity lifts by
  elevation level) rather than shadows. Shadows are invisible on near-black.
- Text should never be pure `#FFFFFF`. `#E5E5E7` or 87%-alpha white reduces
  vibration.
- Brand colours desaturate and lighten on dark — lower chroma so they don't
  glow.

### Contrast measurement

- **WCAG 2** ratio: 4.5 : 1 body, 3 : 1 large, 3 : 1 non-text at AA. AAA raises
  body to 7 : 1.
- **APCA** (Andrew Somers, candidate for WCAG 3) — perceptually-uniform
  lightness contrast on an Lc −108…+106 scale. Handles dark mode honestly where
  WCAG 2 ratio math fails. https://apcacontrast.com/

---

## UX foundations

### Donald Norman

_The Design of Everyday Things_ (1988, revised 2013). Vocabulary:

- **Affordances** — relationships between object properties and agent
  capabilities. Not properties of the object alone.
- **Signifiers** (2013 clarification) — communicate _where_ action takes place.
  The door handle is the signifier; pushing or pulling is the affordance.
- **Feedback** — immediate, informative, proportionate.
- **Mapping** — natural mapping exploits spatial analogies (stove knobs arranged
  like burners).
- **Constraints** — physical, logical, semantic, cultural.
- **Gulf of Execution** — intention → available actions. Bridged by affordances,
  signifiers, constraints, mapping.
- **Gulf of Evaluation** — output → interpretation. Bridged by feedback and a
  clear system image.
- **Seven stages of action** — goal, plan, specify, perform, perceive,
  interpret, compare.

https://www.goodreads.com/book/show/17290807-the-design-of-everyday-things

### Nielsen's ten heuristics (1994, verbatim)

https://www.nngroup.com/articles/ten-usability-heuristics/

1. **Visibility of system status**
2. **Match between system and the real world**
3. **User control and freedom**
4. **Consistency and standards**
5. **Error prevention**
6. **Recognition rather than recall**
7. **Flexibility and efficiency of use**
8. **Aesthetic and minimalist design**
9. **Help users recognize, diagnose, and recover from errors**
10. **Help and documentation**

### Alan Cooper

_About Face_ (4th ed. 2014). Adds:

- **Goal-directed design** — tasks are not goals.
- **Personas** — primary, secondary, supplemental, anti-.
- **Scenarios** — context, key-path, validation.
- **Application posture** — sovereign (Photoshop, Figma, IDEs), transient
  (dialogs), daemonic (invisible background), parasitic (persistent companions).
- Eliminate **excise** — bureaucratic overhead. Reserve interaction for goal
  tasks.

### Peter Morville — UX Honeycomb

Usability is necessary, not sufficient. Seven facets:

> Useful, Usable, Desirable, Findable, Accessible, Credible, Valuable.

https://semanticstudios.com/user_experience_design/

### Laws of UX (Jon Yablonski)

https://lawsofux.com/

- **Hick's Law** — `RT = a + b·log₂(n+1)`. Reduce choices, highlight recommended
  defaults.
- **Fitts's Law** — target-acquisition time is a function of distance and size.
  Make primary actions large, close, at screen edges.
- **Miller's Law** — 7±2 chunks of working memory. Chunking capacity, not a
  nav-item limit.
- **Jakob's Law** — users prefer your site to behave like the ones they know.
- **Tesler's Law** (Conservation of Complexity) — inherent complexity can only
  be moved. Absorb it in the system, not the user.
- **Doherty Threshold** — productivity soars below 400 ms response.
- **Peak-End Rule** — design great confirmations and farewells.
- **Aesthetic-Usability Effect** — first impressions form in ~50 ms.
- **Von Restorff** — isolated items are remembered. Use sparingly.
- **Zeigarnik** — interrupted tasks are remembered. Drive return via onboarding
  completion bars.
- **Law of Common Region** and **Proximity** govern grouping.

### Microinteractions

Dan Saffer, _Microinteractions_ (O'Reilly, 2013). Every small moment has
**Trigger → Rules → Feedback → Loops and Modes**. "Don't add one more thing on
screen; use the overlooked."
https://www.oreilly.com/library/view/microinteractions/9781449326319/

### Animation

Disney's twelve principles (Thomas and Johnston, _The Illusion of Life_, 1981).
UI-adapted by Val Head (_Designing Interface Animation_, 2016) and Rachel Nabors
(_Animation at Work_, 2017). Five essential UI tools:

- Slow-in/slow-out (easing) — the single most important.
- Anticipation — tiny countermove before action.
- Follow-through / overlapping action — staggered settles.
- Secondary action — opacity fade during translate.
- Squash and stretch — minute (button scales to 0.97, not 0).

Skip arc, exaggeration, solid drawing, appeal — those belong to character
animation.

### Mental models and paradigms

- **Mental models** — Craik 1943; Indi Young, _Mental Models_ (2008). The user's
  internal representation. Good design aligns user model with design model via
  the **system image**.
- Paradigms: **skeuomorphism** (pre-2013 iOS), **flat** (Metro 2010, iOS 7
  2013), **neumorphism** (2019, accessibility-failing), **idiomatic** (learned
  conventions that feel natural once acquired — scrollbars, tabs, Cmd+Z).
- **Error recovery** — favour direct action + undo over confirmation dialogs
  (Gmail's "Undo Send" is the template). Confirmations only for actions that are
  destructive, irreversible, and infrequent.

---

## Digital exemplars to study

- **Linear** — https://linear.app — canonical minimalist product.
- **Vercel** — https://vercel.com — black/white precision with Geist.
- **Stripe** — https://stripe.com — subtle gradient meshes, animated product
  illustrations, docs as editorial design.
- **Arc Browser** — https://arc.net — playful personality inside a minimalist
  shell.
- **Rauno Freiberg** — https://rauno.me — miniature OS of micro-details.
- **Emil Kowalski** — https://emilkowal.ski — maker of Sonner and Vaul;
  animations.dev codifies the under-300 ms doctrine.
- **Josh Comeau** — https://www.joshwcomeau.com — warm minimalism with spring
  motion.
- **Family** — https://family.co — Swiss restraint in Web3.
- **Teenage Engineering** — https://teenage.engineering — Scandinavian
  minimalism with humour.
- **Apple** — https://apple.com
- **Things 3** — https://culturedcode.com/things/
- **Notion** — https://notion.so
- **Figma** — https://figma.com
- **Raycast** — https://raycast.com

Studios behind the aesthetic: Pentagram, Spin, Experimental Jetset, Studio
Dumbar/DEPT, Mainstudio, Base Design, Build, North, Bureau Mirko Borsche, Accept
& Proceed.

Counterpoints to know: Ettore Sottsass and Memphis Group (1981, deliberate
postmodern maximalism), Sagmeister Inc. and & Walsh (emotionally charged,
against pure minimalism). Use as provocations, not defaults.
