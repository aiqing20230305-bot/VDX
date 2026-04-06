# Design System — 超级视频Agent

## Product Context
- **What this is:** AI视频生产力平台
- **Who it's for:** 内容创作者、营销团队、视频制作工作室
- **Space/industry:** AI内容生产、视频制作工具
- **Project type:** Web应用 / 专业视频生产工具

## Aesthetic Direction
- **Direction:** Industrial Minimalism（工业极简）
- **Decoration level:** Minimal（极简）
- **Mood:** Professional video tool aesthetic. Clean, functional, information-dense. Typography and spacing do the work. No decoration. The video content is the star, not the UI.
- **Reference sites:** Linear (clean dark UI), GitHub Dark Theme (information density), Adobe Premiere (professional tool aesthetic)

## Typography
- **Display/Hero:** Instrument Serif Bold — Elegant serif for branding. Professional, memorable, breaks from geometric sans trend. Differentiates from "AI startup" look.
- **Body:** DM Sans (keep existing) — Clean, readable, has tabular-nums for data tables, excellent for long reading sessions
- **UI/Labels:** DM Sans — Same as body for consistency
- **Data/Tables:** DM Sans (tabular-nums variant) or JetBrains Mono — Both support monospaced numerals for data alignment
- **Code:** JetBrains Mono (keep existing) — Best monospace for technical content
- **Loading:** 
  - Instrument Serif: `@import url('https://fonts.cdnfonts.com/css/instrument-serif');`
  - DM Sans: `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`
  - JetBrains Mono: `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');`
- **Scale:** 
  - xs: 12px / 0.75rem
  - sm: 14px / 0.875rem (body text, UI labels)
  - base: 16px / 1rem
  - lg: 18px / 1.125rem
  - xl: 20px / 1.25rem
  - 2xl: 24px / 1.5rem
  - 3xl: 32px / 2rem
  - 4xl: 42px / 2.625rem (display headings)
  - 5xl: 48px / 3rem (hero/logo)

## Color
- **Approach:** Restrained (1 accent + neutrals, color is rare and meaningful)
- **Primary Accent:** `#06b6d4` (Cyan) — Technical, creative, breaks AI-tool-purple cliché. Video-native color (think Adobe Premiere's blue family)
- **Secondary Accent:** `#0891b2` (Cyan hover state)
- **Backgrounds:** 
  - Primary: `#0a0a0f` (keep existing)
  - Secondary: `#13131a` (keep existing)
  - Tertiary: `#1a1a24` (keep existing)
  - Elevated: `#1f1f2a`
- **Neutrals:** 
  - Text Primary: `#f5f5f7` (high contrast white)
  - Text Secondary: `#a1a1aa` (mid gray)
  - Text Tertiary: `#71717a` (muted gray)
- **Borders:**
  - Subtle: `rgba(255, 255, 255, 0.08)`
  - Medium: `rgba(255, 255, 255, 0.12)`
  - Strong: `rgba(255, 255, 255, 0.18)`
  - Accent: `rgba(6, 182, 212, 0.3)` (cyan)
- **Semantic:** 
  - Success: `#22c55e`
  - Warning: `#f59e0b`
  - Error: `#ef4444`
  - Info: `#3b82f6`
- **Dark mode:** Already dark theme by default. No light mode needed for professional video tool.

## Spacing
- **Base unit:** 8px (comfortable density for professional tool)
- **Density:** Comfortable — Not too tight (you have data), not too spacious (maximize working area)
- **Scale:** 
  - xs: 8px
  - sm: 12px
  - md: 16px
  - lg: 24px
  - xl: 32px
  - 2xl: 48px
  - 3xl: 64px

## Layout
- **Approach:** Hybrid (grid for tools/data, asymmetric for creative panels)
- **Grid:** 
  - Mobile: 1 column
  - Tablet: 2 columns (768px+)
  - Desktop: 3 columns (1024px+)
  - Wide: 4 columns (1440px+)
- **Max content width:** 1400px (with padding)
- **Border radius:** 
  - sm: 4px (small elements, borders)
  - md: 8px (buttons, inputs, cards)
  - lg: 12px (panels, modals)
  - full: 9999px (pills, status dots)

## Motion
- **Approach:** Minimal-functional (only transitions that aid comprehension)
- **Easing:** 
  - enter: ease-out (elements appearing)
  - exit: ease-in (elements disappearing)
  - move: ease-in-out (position changes)
- **Duration:** 
  - micro: 150ms (hover, focus states)
  - short: 250ms (panel transitions, modals)
  - medium: 400ms (not recommended - prefer short)
  - long: 600ms+ (avoid - too slow for professional tool)

## Anti-Patterns (DO NOT USE)
- ❌ Glass morphism (backdrop-filter blur)
- ❌ Neon glows and halos
- ❌ Purple/violet gradients (AI cliché)
- ❌ Gradient buttons as default CTA
- ❌ Decorative animations (floating, bouncing)
- ❌ Centered-everything layouts
- ❌ Generic geometric sans fonts (Inter, Roboto, Helvetica)
- ❌ 3-column feature grids with colored circle icons

## Design Rationale

### Why Cyan vs Purple?
Every AI tool uses purple (ChatGPT, Claude, Midjourney, every LLM wrapper). Cyan is:
- **Technical** — Familiar from terminals and code editors
- **Creative** — Video/audio software color family (Adobe Premiere, DaVinci Resolve)
- **Fresh** — Breaks the AI-tool-purple cliché

**Result:** You become "professional video tool that uses AI" not "AI wrapper tool."

### Why Instrument Serif?
90% of AI tools use geometric sans (Inter, Satoshi, etc.). A refined serif:
- **Differentiates** — Instant visual separation from AI startup aesthetic
- **Signals craft** — "Design studio" not "tech startup"
- **Memorable** — Brand presence that sticks

**Risk:** Slightly less "tech startup," more "creative studio." Perfect for content creators.

### Why No Decoration?
Glass blur, neon glows, and gradients compete with video content. Industrial minimalism:
- **Content-first** — User's video work is the visual focus
- **Professional** — Matches Adobe/Figma/Linear aesthetic
- **Performance** — No expensive blur effects or animations

### Why High Density?
Professionals generating dozens of videos daily need efficiency:
- **More context visible** — Script + storyboard + timeline in one view
- **Respects expertise** — Dense UI signals "pro tool"
- **Faster workflows** — Less scrolling, more doing

**Trade-off:** Steeper learning curve for new users. Needs good tooltips.

## CSS Variables

```css
:root {
  /* Colors - Backgrounds */
  --bg-primary: #0a0a0f;
  --bg-secondary: #13131a;
  --bg-tertiary: #1a1a24;
  --bg-elevated: #1f1f2a;

  /* Colors - Text */
  --text-primary: #f5f5f7;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717a;

  /* Colors - Accent (Cyan) */
  --accent-primary: #06b6d4;
  --accent-hover: #0891b2;
  --accent-subtle: rgba(6, 182, 212, 0.1);
  --accent-border: rgba(6, 182, 212, 0.3);

  /* Colors - Semantic */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;

  /* Colors - Borders */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-medium: rgba(255, 255, 255, 0.12);
  --border-strong: rgba(255, 255, 255, 0.18);

  /* Typography */
  --font-display: 'Instrument Serif', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Monaco, monospace;

  /* Spacing (8px base) */
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-micro: 150ms ease-out;
  --transition-short: 250ms ease-in-out;
}
```

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-06 | Cyan accent instead of purple | Differentiate from AI tool cliché, align with video software aesthetic |
| 2026-04-06 | Instrument Serif for branding | Break from geometric sans trend, memorable brand presence |
| 2026-04-06 | Remove glass morphism & neon | Content-first, professional tool aesthetic, better performance |
| 2026-04-06 | High information density | Respect professional users' expertise, faster workflows |
| 2026-04-06 | Industrial minimalism aesthetic | Function over decoration, matches Adobe/Linear/GitHub Dark |
| 2026-04-06 | Initial design system created | Created by /design-consultation based on product context |

## Implementation Priority

1. **Phase 1 (Critical):** Update globals.css CSS variables, remove glass/neon effects
2. **Phase 2 (High):** Change accent color from purple to cyan throughout
3. **Phase 3 (Medium):** Update logo/brand typography to Instrument Serif
4. **Phase 4 (Low):** Refine spacing and increase information density where appropriate

## Notes for Developers

- **Do NOT deviate from this system without explicit approval**
- In QA mode, flag any code that doesn't match DESIGN.md
- All new components must use CSS variables, not hardcoded colors
- Glass morphism (backdrop-filter) is explicitly banned
- Purple/violet colors are replaced with cyan `#06b6d4`
- Default font is DM Sans, brand elements use Instrument Serif
