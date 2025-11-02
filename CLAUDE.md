# Claude Instructions for Milo's Personal Site

## Critical Rules

1. **Always check docs first**: Use Grep on `docs/ASTRO.md`, `docs/TAILWIND.md`, `docs/SOLID.md`
2. **Absolute minimalism**: Write the least code possible. No abstractions until needed.
3. **Follow the docs exactly**: They represent best practices.

## Tech Stack

- Astro 5.15.3 (Content Layer API v5)
- Tailwind CSS 4.1.16 (via Vite plugin)
- Solid.js 1.9.10 (use sparingly, client-side interactivity only)
- Fonts: Sentient (serif, body) & Erode (serif) - variable fonts
- **Package Manager**: pnpm (NOT npm or yarn)
- **Math**: KaTeX via remark-math + rehype-katex
- **MDX plugins**: asidesPlugin for side notes

## Critical Gotchas

### Tailwind v4 Dark Mode (Class-Based)
**CRITICAL**: Tailwind v4 defaults to media query dark mode. For class-based (`.dark` on `<html>`):
```css
@custom-variant dark (&:where(.dark, .dark *));
```
Put this at the top of `global.css` after `@import "tailwindcss"`.

### Color System
- Use `oklch()` format (not `rgb()`)
- Define on `html` and `html.dark` selectors (NOT `:root`, NOT in `@theme`)
- `@theme` is for static tokens only
- Opacity: `color-mix(in oklch, var(--color-accent) 20%, transparent)`

### Dark Mode Implementation
- Three-mode: Light → Dark → System
- Blocking inline script in `<head>` prevents flash
- Toggle `.dark` class on `<html>`
- Persist to `localStorage` key `'theme'`

### Content Collections (Astro v5)
- Use `post.id` NOT `post.slug`
- Use `post.data.*` NOT `post.frontmatter.*`
- Config in `src/content.config.ts` NOT `src/content/config.ts`
- Import: `import { glob } from 'astro/loaders'`

## Project Structure

```
src/
├── content/                   # Markdown/MDX posts (flat structure)
├── images/
│   └── reads/                 # Book cover images
├── components/
│   ├── prose/                 # Custom prose components (Heading, Link, etc.)
│   └── TableOfContents/       # TOC with progress bar (Solid.js)
│       ├── TableOfContents.astro
│       ├── PostProgressBar.tsx
│       └── HeadingsIntersectionHighlight.tsx
├── layouts/
│   ├── BaseLayout.astro       # Page shell, dark mode, scrollbar, textures
│   └── BlogPostLayout.astro   # Prose wrapper with TOC
├── lib/                       # Client-side utilities (Solid.js)
│   ├── CommandCenter.tsx      # Command palette (Cmd+K)
│   ├── Commands.tsx           # Command definitions
│   ├── Dialog.tsx             # Modal dialog component
│   ├── Shortcut.tsx           # Keyboard shortcut display
│   ├── color-scheme.ts        # Dark mode utilities
│   ├── focus-trap.ts          # Focus management
│   └── build-time/            # Rehype/remark plugins
│       └── asidesPlugin.ts    # Wraps <aside> with prev sibling
├── pages/
│   ├── index.astro            # Post list
│   ├── reads.astro            # Book covers grid
│   └── [id].astro             # Dynamic post route
└── styles/
    ├── global.css             # Tailwind, fonts, colors, scrollbar
    ├── prose.css              # Markdown styling, .post-aside
    └── shiki.css              # Code block themes (dual light/dark)
```

## Current Features

### BaseLayout.astro
- Paper texture overlay (separate light/dark images)
- Custom scrollbar (non-Mac only, auto-detected)
- Blocking scripts for dark mode + scrollbar detection
- KaTeX CSS loaded from CDN

### BlogPostLayout.astro
- Table of contents integration
- Passes `headings` prop to TOC

### Color Variables (in `global.css`)
`--color-background`, `--color-foreground`, `--color-muted`, `--color-surface`, `--color-border`, `--color-accent`, `--color-accent-foreground`

**IMPORTANT**: Colors are NOT in Tailwind theme. Use inline styles:
```tsx
style={{ "background-color": "var(--color-accent)" }}
```

### Paper Texture Overlay
- `public/paper-light.jpeg` and `public/paper-dark.jpg`
- Two divs: `dark:hidden` and `hidden dark:block`
- Fixed, z-50, pointer-events-none, 512x512 tiled

### Asides Plugin
- Wraps `<aside>` elements with previous sibling in flex container
- Renders side-by-side on wide screens (>1280px)
- Stacks on mobile with border-left
- Usage: `<aside>Side note content here</aside>`
- Styled via `.post-aside` in `prose.css`

### Prose Components
- Custom components in `src/components/prose/`
- Passed to `<Content components={...} />` in `[id].astro`
- Headings have anchor links, custom styles
- Lists, blockquotes, tables, code, paragraphs all customized

### Command Center (Cmd+K)
- Solid.js command palette in `src/lib/CommandCenter.tsx`
- Keyboard navigation, fuzzy search
- Commands defined in `src/lib/Commands.tsx`
- Focus trap and dialog primitives in `src/lib/`
- Color scheme utilities in `src/lib/color-scheme.ts`

### Reads Page
- Grid display of book covers from `src/images/reads/`
- Uses `import.meta.glob()` to load images dynamically
- Responsive grid: 1 col (mobile) → 2 cols (md) → 3 cols (lg)

## Anti-Patterns

❌ `post.slug` → use `post.id`
❌ `post.frontmatter.*` → use `post.data.*`
❌ `src/content/config.ts` → use `src/content.config.ts`
❌ `@apply` directive (removed in Tailwind v4)
❌ `:root` for colors → use `html` and `html.dark`
❌ Colors in `@theme` → use regular CSS vars on `html`
❌ `rgb()` colors → use `oklch()`
❌ Forgetting `@custom-variant dark` for class-based dark mode
❌ Extra files/abstractions before needed
❌ Tailwind color utilities like `bg-accent`, `text-muted` → use inline styles
❌ `@custom-selector` → use `@custom-variant` in Tailwind v4

## Philosophy

> "The best code is no code. The second best is code that follows the docs exactly."

When in doubt: Grep the docs, copy the minimal example, ask before adding complexity.