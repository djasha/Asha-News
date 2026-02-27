# Frontend UI/UX Audit & Optimization Plan

This plan tracks a page-by-page frontend audit so no route is missed.

## Audit criteria (apply to every page)

- [ ] Visual consistency with design tokens (colors, spacing, typography)
- [ ] Responsive behavior (mobile/tablet/desktop)
- [ ] Accessibility (focus states, labels, contrast, keyboard flow)
- [ ] Empty/loading/error states quality
- [ ] No hardcoded API base URL in page-level code
- [ ] No invalid utility classes
- [ ] No emoji-only UI icons (use SVG/Heroicons)
- [ ] Navigation clarity and CTA hierarchy
- [ ] Performance basics (avoid unnecessary rerenders/logging)

## Route/page checklist

### Core user pages

- [x] `/search` (`src/pages/SearchPage.js`)
  - Fixed resilient field filtering and URL param sync behavior.
- [x] `/preferences` (`src/pages/PreferencesPage.js`)
  - Replaced emoji-based UI markers with SVG iconography and improved mobile bottom spacing.
- [x] `/fact-check` (`src/pages/FactCheckerPage.js`)
  - Replaced emoji tab icons, aligned token usage, surfaced existing tabs, centralized API base.
- [x] `/stories` (`src/pages/StoriesPage.js`)
  - Replaced invalid surface utility classes with valid background tokens.
- [x] `/article/:id` (`src/pages/ArticleDetailPage.js`)
  - Moved page-level API base usage to centralized config import.
- [x] `/story/:clusterId` (`src/components/StoryCluster/StoryClusterPage.js`)
  - Replaced invalid background tokens, centralized API base, replaced social engagement emoji glyphs with SVG iconography.
- [x] `/for-you` (`src/pages/ForYou.js`)
  - Moved API base usage to centralized config import.
- [x] `/source/:sourceName` (`src/pages/SourcePage.js`)
  - Moved API base usage to centralized config import.
- [x] `/dashboard` (`src/pages/Dashboard.js`)
  - Replaced account-link/back glyphs with SVG icons for consistency.
- [x] `/debug` (`src/pages/DebugPage.js`)
  - Replaced pass/fail/back glyphs with SVG icons and removed hardcoded Directus host hint.
- [x] `/` (`src/pages/Home.js`)
  - Removed noisy runtime logging in load path and retained centralized relative API usage.
- [x] `/topic/:slug` (`src/pages/TopicPage.js`)
  - Removed noisy debug logging and replaced checkmark glyph feedback with plain text.
- [x] `/category/:category` and category aliases (`src/pages/CategoryPage.js`)
  - Hardened search filtering against missing article fields to prevent runtime crashes.
- [x] `/sources` (`src/pages/SourcesPage.js`)
  - Added page background/token wrapper and normalized card border token usage.
- [x] `/blog` (`src/pages/BlogPage.js`)
  - Replaced arrow glyph with inline SVG and aligned article card styling to design tokens.
- [x] `/auth/signin`, `/auth/signup` (`src/pages/AuthPage.js`)
  - Removed noisy auth submit console logging.
- [x] `/subscription`, `/subscribe` (`src/components/Subscription/SubscriptionDashboard.js`)
  - Added tokenized page wrappers and resolved mount-effect dependency lint warning.
- [x] `/bias-methodology` (`src/pages/BiasMethodologyPage.js`)
  - Added tokenized background wrappers for loading and content states.

### CMS/legal/static pages

- [x] `/about`, `/features`, `/contact`, `/api`, `/page/:slug` (`src/pages/StaticCMSPage.js`)
  - Added tokenized full-page wrapper and consistent loading/fallback presentation.
- [x] `/privacy`, `/terms`, `/cookies`, `/gdpr` (`src/pages/LegalPage.js`)
  - Added tokenized full-page wrapper and consistent legal content layout styling.
- [x] `/careers`, `/rss` fallback route views (`src/App.js` inline route elements)
  - Replaced bare placeholders with styled, token-aligned fallback route views.

### Admin frontend pages

- [x] Admin shell/nav (`src/components/Layout/AdminLayout.js`)
  - Normalized shell colors/borders/text to shared design-token classes for consistency.
- [x] `/admin/dashboard` (`src/pages/admin/AdminDashboard.js`)
  - Replaced dynamic Tailwind icon class generation with a safe static mapping and normalized token usage.
- [x] Admin settings hub (`src/pages/AdminSettingsPage.js`)
  - Replaced emoji indicators and tab icons, fixed background token, centralized API base.
- [x] `/admin/settings` (`src/pages/admin/SiteSettings.js`)
  - Normalized form containers, labels, and inputs to shared design-token classes.
- [x] `/admin/users` (`src/pages/admin/UserManagement.js`)
  - Normalized table and copy styling to shared design-token classes.
- [x] `/admin/rss` (`src/pages/RSSManagementPage.js`)
  - Normalized page/table/status styling to design tokens and resolved mount-effect dependency lint warning.
- [x] `/admin/subscriptions` (`src/pages/admin/SubscriptionTiers.js`)
  - Centralized API base and normalized endpoint paths.

## Execution order

1. Stabilize shared shells: header/footer/navigation/admin layout.
2. Fix high-traffic pages: Home, Stories detail, Article, Search, Fact Check.
3. Complete remaining user pages and static/legal pages.
4. Complete admin pages.
5. Final responsive/accessibility pass across all routes.
6. Run verification: build + route smoke checks.
