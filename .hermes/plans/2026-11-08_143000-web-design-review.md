# Web Design Review Plan — Thám tử Hình sự

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Comprehensive review of the web design (UI/UX, components, screens, styling, responsiveness, accessibility) for the "Thám tử Hình sự" React 19 + TypeScript application.

**Architecture:** Client-side SPA with hash routing, 12 screens, custom component library, academic light theme, responsive down to 360px. No backend, localStorage persistence.

**Tech Stack:** React 19, TypeScript, Vite 7, Vitest, Testing Library + happy-dom, CSS (custom, no framework), JSON Schema validation (Ajv).

---

## Current Context

- **Project root:** `D:\LegalGame` (active workspace)
- **Source:** `src/` — 12 screens in `src/ui/screens/`, components in `src/ui/components.tsx`, styles in `src/styles.css`
- **Content:** Single draft case (`case_001`), law bundle separate, manifest-driven
- **Tests:** 160 tests across 21 files, including UI tests with Testing Library
- **Demo:** https://ngminhduc129.github.io/tham-tu-hinh-su/

---

## Step-by-Step Plan

### Task 1: Inventory All UI Screens & Components

**Objective:** Create a complete map of all screens, their routes, and shared components.

**Files:**
- Read: `src/ui/screens/*.tsx` (12 files)
- Read: `src/ui/components.tsx`
- Read: `src/ui/router.ts`
- Read: `src/App.tsx` (routing + shell)

**Step 1.1: List all screens with routes**

```bash
# Run in terminal
ls src/ui/screens/
```

Expected output: 12 screen files matching README.md list.

**Step 1.2: Extract component exports from components.tsx**

```bash
grep -n "^export" src/ui/components.tsx
```

**Step 1.3: Map routes to screens**

Read `src/ui/router.ts` and `src/App.tsx` → document route → screen mapping.

**Verification:** Create a markdown table in plan output with: Screen | Route | Component File | Key Components Used.

---

### Task 2: Analyze Design System & Styling

**Objective:** Document the design tokens, color palette, typography, spacing, and component variants.

**Files:**
- Read: `src/styles.css` (full)
- Read: `src/ui/components.tsx` (component implementations)
- Read: `src/ui/screens/*.tsx` (usage patterns)

**Step 2.1: Extract CSS custom properties (design tokens)**

```bash
grep -n "^--" src/styles.css | head -50
```

**Step 2.2: Document color palette**

Search for: `--color-`, `color:`, `background-color:`, `border-color:`

**Step 2.3: Document typography scale**

Search for: `font-size`, `font-weight`, `line-height`, `font-family`

**Step 2.4: Document spacing system**

Search for: `gap`, `padding`, `margin`, `--space-`

**Step 2.5: Document component variants**

From `components.tsx`: Button (primary/secondary/ghost), Badge (tones), Card, Callout (tones), Stepper, etc.

**Verification:** Produce a design tokens reference document (markdown) with all extracted values.

---

### Task 3: Review Screen-by-Screen UI/UX

**Objective:** Evaluate each of the 12 screens for layout, content hierarchy, interaction patterns, and consistency.

**Files:**
- Read: Each `src/ui/screens/*.tsx` (12 files)
- Read: Corresponding test files `src/ui/screens/*.test.tsx`

**Screens to review (in user flow order):**

| # | Screen | Route | Key Focus |
|---|--------|-------|-----------|
| 1 | HomeScreen | `#/` | Case picker, onboarding |
| 2 | BriefScreen | `#/case/<id>/brief` | Narrative, task prompt, player role |
| 3 | CaseFileScreen | `#/case/<id>/casefile` | Timeline, facts, characters |
| 4 | EvidenceBoardScreen | `#/case/<id>/evidence` + `#/case/<id>/investigation` | Discovery, evaluation, evidence detail modal |
| 5 | HypothesesScreen | `#/case/<id>/hypotheses` | Missing info, hypothesis generation |
| 6 | ProofMatrixScreen | `#/case/<id>/proof` | Propositions, evidence links, proof status |
| 7 | AnalysisScreen | `#/case/<id>/analysis` | Legal reasoning, charge comparison |
| 8 | SubmissionScreen | `#/case/<id>/submission` | Conclusion selection, submit guard |
| 9 | FeedbackScreen | `#/case/<id>/feedback` | Score breakdown, criteria, explanations |
| 10 | NotebookScreen | `#/case/<id>/notebook` | Personal notes, export |
| 11 | SettingsScreen | `#/settings` | Export/import/reset, session management |
| 12 | EvidenceDetail (modal) | Inline in EvidenceBoard | Evidence content, procedural defects, limitations |

**For each screen, document:**

1. **Layout structure** — grid/flex, containers, sections
2. **Content hierarchy** — headings, body, interactive elements
3. **Key interactions** — clicks, form inputs, modals, navigation
4. **State handling** — loading, empty, error, read-only (submitted)
5. **Accessibility** — ARIA labels, keyboard navigation, focus management, heading levels
6. **Responsive behavior** — 360px, 768px, 1024px+ breakpoints
7. **Consistency check** — component reuse, design token usage, pattern adherence

**Step 3.1: Create screen review template**

```markdown
## Screen: [Name] (`[route]`)

### Layout
- Container: [max-width, padding, centering]
- Sections: [list with purpose]
- Grid/Flex: [key layout patterns]

### Content Hierarchy
- H1: [text]
- H2/H3: [list]
- Body text: [key paragraphs]
- Interactive: [buttons, selects, checkboxes, links]

### Interactions
- Primary CTA: [what, where]
- Secondary actions: [list]
- Form fields: [types, validation]
- Modals/drawers: [trigger, content]

### State Variants
- Default: [description]
- Loading: [if any]
- Empty: [if any]
- Error: [if any]
- Read-only (submitted): [differences]

### Accessibility
- Headings: [levels correct?]
- Labels: [form inputs have labels?]
- ARIA: [roles, states, live regions]
- Keyboard: [tab order, focus visible, escape handling]
- Color contrast: [meets WCAG AA?]

### Responsive
- 360px: [layout changes]
- 768px: [layout changes]
- 1024px+: [layout changes]

### Consistency Issues
- [ ] Uses design tokens
- [ ] Reuses shared components
- [ ] Follows naming conventions
- [ ] Matches Figma/design spec (if any)
```

**Step 3.2: Apply template to all 12 screens**

**Verification:** 12 completed screen review documents.

---

### Task 4: Component Library Audit

**Objective:** Evaluate shared components for completeness, consistency, reusability, and accessibility.

**Files:**
- Read: `src/ui/components.tsx` (full)
- Read: `src/ui/screens/*.tsx` (usage examples)

**Components to audit:**

| Component | Props | Variants | Used In |
|-----------|-------|----------|---------|
| Button | variant, size, disabled, onClick | primary, secondary, ghost | All screens |
| Badge | tone, size | success, warning, danger, info, neutral | Header, Feedback |
| Card | className, children | — | All screens |
| Callout | tone, title, children | info, success, warning, danger | Feedback, guards |
| Stepper | currentStage, stages | — | GameShell (all case screens) |
| EvidenceDetail | evidence, onClose | — | EvidenceBoard |
| Form controls | — | — | Various |

**For each component, document:**

1. **API surface** — props, types, defaults
2. **Variants** — visual states, when to use each
3. **Accessibility** — native HTML semantics, ARIA, keyboard
4. **Styling** — design token usage, CSS structure
5. **Test coverage** — existing tests in `*.test.tsx`
6. **Gaps** — missing variants, inconsistent props, no doc

**Step 4.1: Extract component prop types**

```bash
grep -A 20 "export interface.*Props" src/ui/components.tsx
```

**Step 4.2: Check test coverage**

```bash
grep -r "Button\|Badge\|Card\|Callout\|Stepper" src/ui/screens/*.test.tsx
```

**Verification:** Component audit report with gaps and recommendations.

---

### Task 5: Responsive Design Verification

**Objective:** Verify responsive behavior at 360px, 768px, 1024px, 1440px breakpoints.

**Files:**
- Read: `src/styles.css` (media queries)
- Read: `src/ui/screens/*.tsx` (responsive classes)
- Terminal: Playwright script for visual verification

**Step 5.1: Extract all media queries**

```bash
grep -n "@media" src/styles.css
```

**Step 5.2: Document breakpoint system**

| Breakpoint | Query | Purpose |
|------------|-------|---------|
| 360px | `@media (max-width: 360px)` | Mobile minimum |
| 768px | `@media (min-width: 768px)` | Tablet |
| 1024px | `@media (min-width: 1024px)` | Desktop |
| 1440px | `@media (min-width: 1440px)` | Large desktop |

**Step 5.3: Playwright visual regression script**

Create `scripts/responsive-check.mjs`:

```javascript
const { chromium } = require('playwright');
const screens = [
  { name: 'Home', route: '' },
  { name: 'Brief', route: 'case/case_001/brief' },
  { name: 'Evidence', route: 'case/case_001/evidence' },
  { name: 'Submission', route: 'case/case_001/submission' },
  { name: 'Feedback', route: 'case/case_001/feedback' },
];
const viewports = [
  { name: 'mobile-360', width: 360, height: 640 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const screen of screens) {
    for (const vp of viewports) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:5173/#/${screen.route}`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ 
        path: `screenshots/${screen.name}-${vp.name}.png`, 
        fullPage: true 
      });
      await page.close();
    }
  }
  await browser.close();
})();
```

**Step 5.4: Run and review screenshots**

```bash
node scripts/responsive-check.mjs
```

**Verification:** Screenshots for 5 key screens × 4 viewports = 20 images. Document issues: horizontal scroll, text overflow, touch targets < 44px, layout breakage.

---

### Task 6: Accessibility Audit (WCAG 2.1 AA)

**Objective:** Comprehensive a11y review across all screens.

**Files:**
- Read: `src/ui/screens/*.tsx`
- Read: `src/ui/components.tsx`
- Read: `src/styles.css` (focus styles, contrast)
- Terminal: axe-core via Playwright

**Step 6.1: Automated axe-core scan**

Create `scripts/a11y-scan.mjs`:

```javascript
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

const routes = [
  '', 'case/case_001/brief', 'case/case_001/casefile',
  'case/case_001/evidence', 'case/case_001/hypotheses',
  'case/case_001/proof', 'case/case_001/analysis',
  'case/case_001/submission', 'case/case_001/feedback',
  'case/case_001/notebook', 'settings'
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const route of routes) {
    const page = await browser.newPage();
    await page.goto(`http://localhost:5173/#/${route}`);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    console.log(`\n=== ${route || 'home'} ===`);
    console.log(`Violations: ${results.violations.length}`);
    results.violations.forEach(v => {
      console.log(`  [${v.impact}] ${v.help}: ${v.nodes.length} nodes`);
      v.nodes.forEach(n => console.log(`    - ${n.target.join(' ')}`));
    });
    await page.close();
  }
  await browser.close();
})();
```

```bash
npm install -D @axe-core/playwright
node scripts/a11y-scan.mjs
```

**Step 6.2: Manual checklist per screen**

| Criterion | Check |
|-----------|-------|
| Heading hierarchy | h1 → h2 → h3, no skips |
| Landmarks | main, nav, aside, header, footer |
| Form labels | Every input has `<label>` or `aria-label` |
| Focus visible | `:focus-visible` styles on all interactive |
| Keyboard navigation | Tab order logical, no traps |
| Skip link | "Bỏ qua điều hướng" works |
| ARIA live regions | Dynamic updates announced |
| Color contrast | Text ≥ 4.5:1, UI ≥ 3:1 |
| Touch targets | ≥ 44×44px on mobile |
| Language | `lang="vi"` on html |

**Verification:** Axe report + manual checklist results. Prioritize: critical/serious violations first.

---

### Task 7: Design Consistency & Polish

**Objective:** Identify visual inconsistencies, polish gaps, and improvement opportunities.

**Files:**
- All screen files, components, styles.css

**Step 7.1: Visual inventory checklist**

| Aspect | Check |
|--------|-------|
| Color usage | Only design tokens, no hardcoded hex |
| Spacing | Consistent scale (4px base), no magic numbers |
| Typography | Consistent scale, line-height, font-weight |
| Border radius | Consistent (4px, 8px, 12px, full) |
| Shadows | Consistent elevation system |
| Icons | Consistent size (16, 20, 24px), style |
| Loading states | Skeleton, spinner, or disabled consistently |
| Empty states | Illustrations, helpful copy, CTA |
| Error states | Inline, toast, or callout consistently |
| Transitions | Consistent duration/easing (150-200ms) |

**Step 7.2: Dark mode readiness**

Check: CSS custom properties for colors, `prefers-color-scheme` media query, no hardcoded backgrounds.

**Step 7.3: Print stylesheet**

Check: `@media print` for Feedback/Notebook screens.

**Verification:** List of inconsistencies with file:line references and suggested fixes.

---

### Task 8: Performance & Bundle Analysis

**Objective:** Identify performance bottlenecks in the production build.

**Files:**
- `dist/` (after build)
- `vite.config.ts`
- `package.json`

**Step 8.1: Build and analyze**

```bash
npm run build
npx vite-bundle-analyzer dist
```

**Step 8.2: Key metrics**

| Metric | Target | Current |
|--------|--------|---------|
| JS bundle (gzipped) | < 150 KB | ~552 KB (warning) |
| CSS bundle (gzipped) | < 20 KB | — |
| First Contentful Paint | < 1.5s | — |
| Largest Contentful Paint | < 2.5s | — |
| Cumulative Layout Shift | < 0.1 | — |

**Step 8.3: Code splitting opportunities**

Check: Dynamic imports for heavy screens (EvidenceBoard, ProofMatrix), lazy load law bundle.

**Verification:** Bundle analysis report with recommendations.

---

### Task 9: Cross-Browser Compatibility

**Objective:** Verify rendering in Chrome, Firefox, Safari (WebKit).

**Step 9.1: Playwright multi-browser test**

```bash
npx playwright install chromium firefox webkit
```

Create `scripts/cross-browser.mjs` — run smoke test on 3 browsers.

**Step 9.2: Known issues checklist**

| Feature | Chrome | Firefox | Safari |
|---------|--------|---------|--------|
| Hash routing | ✅ | ✅ | ✅ |
| localStorage | ✅ | ✅ | ✅ (private mode?) |
| CSS Grid/Flex | ✅ | ✅ | ✅ |
| CSS Custom Props | ✅ | ✅ | ✅ |
| `:focus-visible` | ✅ | ✅ | ✅ |
| `dialog` element | ✅ | ✅ | ⚠️ polyfill |

**Verification:** Test results matrix.

---

### Task 10: Documentation & Handoff

**Objective:** Produce final design review report and handoff documents.

**Deliverables:**

1. **Design Review Report** — `docs/design-review-YYYY-MM-DD.md`
   - Executive summary
   - Screen-by-screen findings
   - Component audit
   - A11y violations (prioritized)
   - Responsive issues
   - Performance metrics
   - Recommendations (P0/P1/P2)

2. **Design Tokens Reference** — `docs/design-tokens.md`
   - Colors, spacing, typography, shadows, radii, transitions

3. **Component Library Doc** — `docs/components.md`
   - Each component: props, variants, usage examples, a11y notes

4. **Responsive Screenshots** — `docs/screenshots/`
   - Organized by screen/viewport

5. **A11y Report** — `docs/a11y-report.md`
   - Axe violations + manual findings

---

## Files Likely to Change (During Implementation of Fixes)

| Category | Files |
|----------|-------|
| Styles | `src/styles.css`, `src/ui/components.tsx` |
| Screens | `src/ui/screens/*.tsx` (12 files) |
| Tests | `src/ui/screens/*.test.tsx` |
| Config | `vite.config.ts`, `package.json` |
| Docs | `docs/design-review-*.md`, `docs/design-tokens.md`, `docs/components.md` |
| Scripts | `scripts/responsive-check.mjs`, `scripts/a11y-scan.mjs`, `scripts/cross-browser.mjs` |

---

## Tests / Validation

| Test | Command | Expected |
|------|---------|----------|
| Unit tests | `npm test` | 160 passed |
| Lint content | `npm run lint:content` | 0 error, ≤7 warning |
| Type check | `npm run build` (includes `tsc --noEmit`) | No errors |
| A11y scan | `node scripts/a11y-scan.mjs` | 0 critical, 0 serious |
| Responsive | `node scripts/responsive-check.mjs` | No horizontal scroll, no overflow |
| Cross-browser | `node scripts/cross-browser.mjs` | All pass |
| Bundle size | `npm run build && npx vite-bundle-analyzer dist` | JS < 150 KB gzipped |

---

## Risks, Tradeoffs, Open Questions

### Risks
1. **Large bundle (552 KB)** — May need code splitting or dependency audit
2. **Draft case content** — UI may not reflect final content structure (placeholders, missing proof rows)
3. **No browser E2E tests** — Current tests use happy-dom (no real layout)
4. **Single case** — Responsive/a11y testing limited to case_001 content

### Tradeoffs
1. **Custom CSS vs framework** — More control but more maintenance; current approach is fine for scope
2. **Hash routing vs History API** — Hash works on GitHub Pages without server config; acceptable
3. **Testing Library + happy-dom vs Playwright** — Fast unit tests but no visual regression; need both

### Open Questions
1. **Dark mode required?** — Not in current spec; CSS custom properties make it feasible
2. **Internationalization?** — Vietnamese only currently; design should accommodate longer text
3. **Print stylesheet needed?** — Feedback/Notebook screens likely printed by learners
4. **Animation/motion preferences?** — `prefers-reduced-motion` not implemented
5. **Component library extraction?** — Could be published separately for reuse

---

## Execution Handoff

**Plan complete and saved to:** `.hermes/plans/2026-11-08_143000-web-design-review.md`

**Ready to execute using subagent-driven-development** — I'll dispatch a fresh subagent per task with two-stage review (spec compliance then code quality). Shall I proceed?

**Suggested execution order:**
1. Tasks 1-2 (Inventory + Design System) — Foundation
2. Task 3 (Screen Review) — Core UX
3. Task 4 (Component Audit) — Reusability
4. Task 5-6 (Responsive + A11y) — Quality gates
5. Task 7 (Consistency) — Polish
6. Task 8-9 (Performance + Cross-browser) — Production readiness
7. Task 10 (Documentation) — Handoff