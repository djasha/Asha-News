# Asha.News — Strategic Plan & Direction Report
**Date**: February 24, 2026  
**Purpose**: Full project re-plan, competitive analysis, architecture recommendations, monetization strategy

---

## 1. Current State Audit

### What Exists Today
| Layer | Tech | Status |
|-------|------|--------|
| **Frontend** | React 18, Tailwind CSS, React Router | Working, modern UI with dark mode |
| **Backend** | Node.js/Express (port 3001) | Working, ~27 route files, ~24 services |
| **CMS** | Directus (self-hosted, PostgreSQL) | Heavy dependency — candidate for removal |
| **Auth** | Firebase Auth (frontend) + JWT/custom (backend) | Partially integrated |
| **AI** | Groq, OpenAI, Google Gemini, Perplexity | Multi-provider with admin toggles |
| **RSS** | rss-parser + custom ingestion pipeline | 21 feeds, ~37 articles/refresh |
| **Payments** | Stripe (library installed, routes exist) | Scaffolded but not live |
| **Clustering** | AI-powered via Groq embeddings (384-dim vectors) | Working — core differentiator |
| **Fact-Check** | Google Fact Check API + AI analysis | Working |
| **Hosting** | Netlify (frontend) + VPS (backend/Directus) | Split deployment |

### Key Metrics (from executive summary)
- **41,000+ articles** ingested
- **3,610+ story clusters** created
- **21 active RSS sources**
- **<500ms** average API response
- **<10s** clustering for 200 articles

### Codebase Health Issues
- **Directus coupling**: 28KB DirectusService, 18KB directusFlowService, plus frontend directusService (18KB) — massive surface area tightly coupled to Directus
- **Bloated server.js**: 49KB monolith handling routes, middleware, and CMS proxy
- **Mock data remnants**: Mostly cleaned (previous session), but `src/data/mockSources.js` and `src/data/mockArticles.js` files still exist
- **Dead code**: Backup files (FactCheckerPage.backup.js at 66KB), archive folders, setup-archive (77 items)
- **AdminSettingsPage.js**: 77KB single component — extreme bloat
- **Dashboard.js**: 40KB single component
- **Duplicate dependencies**: groq-sdk and openai in both root and server package.json

---

## 2. Competitive Landscape (Feb 2026)

### Direct Competitors

| Platform | Founded | Team | Revenue | Model | Key Feature |
|----------|---------|------|---------|-------|-------------|
| **Ground News** | 2018 | ~30 | Est. $5-10M ARR | Freemium: Free / Pro $9.99yr / Premium $29.99yr / Vantage $99.99yr | 50,000+ sources, blindspot detection, bias distribution |
| **AllSides** | 2011 | 21 | ~$3M ARR | Ad-supported + memberships + B2B licensing + equity crowdfunding | Media bias ratings, headline roundups, Red/Blue/Purple columns |
| **Biasly** | 2017 | 24 | Unknown | Freemium + API licensing | AI bias meter, politician ratings |
| **TIMIO News** | 2023 | 3 | Pre-revenue | Free (beta) | AI bias detection, no preference algorithm |
| **GeoBarta** | ~2024 | Small | Pre-revenue | Free | Location-based unbiased news |
| **MediaSense AI** | ~2025 | Small | Freemium pilot | B2B SaaS | Newsroom intelligence, trend radar |

### Ground News (Primary Competitor) — Deep Dive
- **Pricing**: Free tier is extremely limited. Pro at $9.99/yr is a gateway. Premium at $29.99/yr is their volume tier. Vantage at $99.99/yr (often discounted 40%) is their power-user tier.
- **Distribution**: Web + iOS + Android + browser extension
- **Moat**: 50,000 source database, years of bias rating data, strong YouTube/podcast influencer partnerships (WhyFiles, etc.)
- **Weakness** (per CJR Sept 2025 analysis): Over-reliance on AI summaries over original journalism, binary left/right framing oversimplifies bias, sustainability questions about freemium conversion
- **Key insight**: Ground News grew primarily through influencer sponsorships (YouTube, podcasts) — not traditional marketing

### AllSides — Deep Dive  
- **Revenue**: ~$3M ARR on 21 employees
- **Model**: Ad revenue + "Join" memberships + B2B licensing (AllSides for Schools, enterprise services) + equity crowdfunding (WeFunder)
- **Moat**: Brand trust, editorial philosophy (balanced left/center/right columns), community-driven bias ratings, Public Benefit Corporation status
- **Weakness**: Small, US-focused, no AI clustering, relatively low-tech

### Market Gaps Asha.News Can Exploit
1. **No competitor focuses on the Global South / Muslim world / Palestine coverage** — massive underserved audience
2. **No competitor offers AI-powered fact-checking integrated with bias analysis** — Asha has this
3. **No competitor does real-time AI story clustering with multi-perspective summaries** — Asha has this working
4. **B2B/API licensing of bias + clustering data** is an untapped goldmine (see Microsoft Publisher Content Marketplace, Factiva licensing trends)
5. **Education/media literacy vertical** — AllSides has AllSides for Schools but it's basic; AI-powered media literacy tools are in demand

---

## 3. Recommendation: Remove Directus — Replace with Custom Lightweight Backend

### Why Remove Directus

| Problem | Impact |
|---------|--------|
| **Operational overhead**: Separate Docker container, PostgreSQL dependency, schema migrations | Increases hosting cost and complexity |
| **Over-engineered for our use case**: We use ~10% of Directus features (CRUD on articles, clusters, users, settings) | 90% bloat |
| **Tight coupling**: 3 large service files + dozens of `directusFetch` calls throughout the codebase | Hard to modify or extend |
| **No AI integration**: Directus has zero AI features; all AI logic lives in our custom services anyway | Redundant layer |
| **Admin panel not useful**: We built a custom admin (AdminSettingsPage.js) because Directus admin was insufficient | Two admin panels = confusion |
| **Cost**: Directus Cloud is expensive; self-hosted requires PostgreSQL + Directus container + maintenance | VPS overhead |

### What Replaces It

**Option A (Recommended): PostgreSQL + Custom Express API**
- Keep PostgreSQL as the database (it's proven, scalable, and you already have the data there)
- Replace all `directusFetch` / `DirectusService` calls with direct PostgreSQL queries using a lightweight ORM
- Use **Drizzle ORM** or **Knex.js** — type-safe, lightweight, excellent migration support
- Your existing Express routes barely change — just swap the data layer

**Option B: SQLite for dev, PostgreSQL for prod**  
- Use `better-sqlite3` (already in dependencies) for local development
- PostgreSQL in production via your VPS
- Drizzle ORM supports both seamlessly

**Option C: Payload CMS (if you still want a CMS)**
- Open-source, Node.js/TypeScript, built on Express
- Has native AI plugin ecosystem (2026)
- More developer-friendly than Directus
- But: still adds a dependency layer you may not need

### My Strong Recommendation: **Option A**

You already have the entire API built in Express. Directus is just a database wrapper at this point. Replace the wrapper with ~200 lines of a database access layer using Drizzle/Knex and you eliminate an entire infrastructure component.

**Migration path**:
1. Export all Directus data to SQL dump
2. Create Drizzle schema matching existing tables
3. Replace `DirectusService` methods with direct DB queries
4. Remove Directus Docker container, SDK dependencies, proxy routes

---

## 4. Recommended Architecture (Post-Cleanup)

```
┌─────────────────────────────────────────────────┐
│                    VPS (Single Server)           │
│                                                  │
│  ┌──────────────┐     ┌────────────────────┐    │
│  │  PostgreSQL   │────▶│  Express API        │    │
│  │  (articles,   │     │  (Node.js)          │    │
│  │   clusters,   │     │  - REST endpoints   │    │
│  │   users,      │     │  - RSS ingestion    │    │
│  │   settings)   │     │  - AI services      │    │
│  └──────────────┘     │  - Cron jobs         │    │
│                        │  - Stripe webhooks   │    │
│                        │  - Auth (Firebase)   │    │
│                        └────────────────────┘    │
│                                                  │
│  ┌──────────────┐     ┌────────────────────┐    │
│  │  Redis        │     │  Worker Process     │    │
│  │  (caching,    │     │  (clustering,       │    │
│  │   sessions,   │     │   RSS processing,   │    │
│  │   rate-limit) │     │   AI analysis)      │    │
│  └──────────────┘     └────────────────────┘    │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Caddy / Nginx (reverse proxy + SSL)      │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘

┌──────────────────┐
│  Frontend (SPA)   │  ← Deployed to Netlify/Vercel OR served by Caddy
│  React + Tailwind │
└──────────────────┘
```

### Key Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| **Database** | PostgreSQL | Already have data there; proven at scale; full-text search built-in |
| **ORM** | Drizzle ORM | Type-safe, lightweight, excellent migration tooling |
| **Cache** | Redis (optional, start without) | Rate limiting, session store, API cache; add when needed |
| **AI** | Keep multi-provider (Groq primary, OpenAI fallback) | Cost optimization; Groq is fastest and cheapest for embeddings |
| **Auth** | Firebase Auth (frontend) + JWT verification (backend) | Already works; battle-tested; free tier generous |
| **Payments** | Stripe | Already scaffolded; industry standard |
| **Frontend hosting** | Netlify or self-serve from VPS via Caddy | Netlify free tier is fine; or consolidate to VPS |
| **CI/CD** | GitHub Actions → auto-deploy to VPS | Simple: push to main → SSH → pull → restart |

---

## 5. Product Direction & Differentiation

### Core Identity
**Asha.News = "AI-powered news intelligence for underserved perspectives"**

Not just another bias checker. Asha differentiates on:
1. **Global South & underrepresented voices** — Palestine, Africa, South/Southeast Asia coverage that Ground News and AllSides largely ignore
2. **AI-native from day one** — clustering, fact-checking, bias analysis, summarization all powered by AI (not manual editorial like AllSides)
3. **Transparency as product** — show users HOW and WHY the AI rated something, not just the rating

### Feature Priority Matrix

| Feature | Value to User | Difficulty | Priority |
|---------|--------------|------------|----------|
| **Story Clustering with multi-perspective view** | ★★★★★ | Already built | **SHIP IT** |
| **AI Bias Analysis on every article** | ★★★★★ | Already built | **SHIP IT** |
| **Blindspot Detection** (stories only covered by one side) | ★★★★★ | Medium | **Phase 1** |
| **Personal Bias Dashboard** ("My News Bias") | ★★★★☆ | Medium | **Phase 1** |
| **Mobile App (React Native or PWA)** | ★★★★★ | High | **Phase 2** |
| **AI Daily Brief** (personalized newsletter) | ★★★★☆ | Medium | **Phase 2** |
| **Browser Extension** | ★★★★☆ | Medium | **Phase 2** |
| **Fact-Check Integration** | ★★★★☆ | Already built | **Polish & Ship** |
| **Source Credibility Scores** | ★★★☆☆ | Low | **Phase 1** |
| **Custom Feeds / Topic Following** | ★★★☆☆ | Low-Medium | **Phase 1** |
| **API for developers/researchers** | ★★★★☆ | Medium | **Phase 3** |
| **B2B Licensing (education, enterprise)** | ★★★★★ | Medium | **Phase 3** |
| **Community fact-checking** | ★★☆☆☆ | High | **Backlog** |

---

## 6. Monetization Strategy

### Revenue Model: Hybrid Freemium + B2B

Based on research of Ground News, AllSides, and 2026 monetization trends (hybrid models outperforming pure subscription), here's the recommended approach:

### Consumer Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 10 articles/day, basic bias indicators, AI summaries, top stories feed |
| **Pro** | $4.99/mo or $29.99/yr | Unlimited articles, full bias analysis, personal bias dashboard, blindspot alerts, custom feeds, ad-free |
| **Premium** | $9.99/mo or $79.99/yr | Everything in Pro + AI daily briefs, advanced fact-checking, API access (1000 calls/mo), priority support, export data |

**Key insight from Ground News**: Their cheapest paid tier ($9.99/YEAR) is a loss-leader designed to hook users into upgrading. Consider a similar approach — even $1/mo Pro tier to convert free users to paying.

### B2B Revenue Streams

| Stream | Target | Pricing Model | Potential |
|--------|--------|--------------|-----------|
| **Asha for Education** | Universities, schools, media literacy programs | $99-499/yr per institution | High — AllSides for Schools proves demand |
| **Bias Analysis API** | Researchers, other platforms, newsrooms | Usage-based: $0.01-0.05/article analyzed | High — unique AI capability |
| **Clustering Data Feed** | News aggregators, analytics firms | Monthly subscription: $500-5000/mo | Medium-High |
| **White-label bias widget** | Publishers who want bias indicators on their articles | Per-site license: $200-1000/mo | Medium |
| **AI Content Licensing** | Enterprise clients wanting bias-analyzed news feeds for internal LLMs | Usage-based | Long-term high (see Factiva/Economist trend) |

### Monetization Priority Order
1. **Launch Free + Pro tier** (get paying users ASAP, validate willingness to pay)
2. **Add Premium tier** when you have 1000+ Pro subscribers
3. **Launch Asha for Education** (grant/foundation funding available for media literacy)
4. **Open API** for developers and researchers
5. **B2B licensing** once you have proven data quality

### Revenue Projections (Conservative)

| Timeline | Users | Paid Conversion | MRR | ARR |
|----------|-------|-----------------|-----|-----|
| Month 6 | 5,000 | 3% (150 paid) | $750 | $9,000 |
| Month 12 | 20,000 | 5% (1,000 paid) | $5,000 | $60,000 |
| Month 18 | 50,000 | 7% (3,500 paid) | $17,500 | $210,000 |
| Month 24 | 100,000 | 8% (8,000 paid) | $40,000+ | $480,000+ |

*B2B revenue not included — could add 20-50% on top*

---

## 7. Growth Strategy

### Distribution Channels (Inspired by Ground News playbook)

1. **YouTube/Podcast Sponsorships** — Ground News grew almost entirely this way. Find creators in:
   - Media literacy / journalism space
   - Political commentary (balanced, not partisan)
   - Muslim/Palestine/Global South content creators (unique angle)
   - Tech/AI enthusiasts
   
2. **SEO Content** — Publish media literacy articles, bias breakdowns of current events, "how X story was covered across the spectrum" posts (AllSides does this effectively)

3. **Social Media** — Short-form content showing bias breakdowns of trending stories (TikTok, Instagram Reels, X/Twitter threads)

4. **Education Partnerships** — Partner with journalism schools, media literacy nonprofits (News Literacy Project, First Draft)

5. **Browser Extension** — Low-friction distribution; shows bias rating on any news article the user reads

6. **Referral Program** — "Give a friend 1 month of Pro free" (proven for news apps)

### Launch Strategy
1. **Soft launch** with existing features (clustering + bias analysis + fact-checking)
2. **Product Hunt launch** for initial awareness
3. **Target 3-5 mid-size YouTubers** for sponsored reviews ($500-2000 each)
4. **Submit to "best news apps" listicles** (GeoBarta, StationX, etc. regularly publish these)
5. **Open beta API** for developers/researchers to generate organic buzz

---

## 8. Implementation Roadmap

### Phase 0: Clean & Ship (2-3 weeks) — CURRENT
- [x] Remove all mock data from production code
- [x] Remove hardcoded credentials
- [x] Fix CORS and security basics
- [ ] Delete dead files (mockArticles.js, mockSources.js, backup files, archive folders)
- [ ] Implement Stripe subscription flow (routes exist, wire up frontend)
- [ ] Add article read-count gating (Free tier: 10/day)
- [ ] Polish homepage, clustering view, fact-checker
- [ ] Deploy and make accessible at asha.news

### Phase 1: Replace Directus + Core Features (4-6 weeks)
- [ ] Set up Drizzle ORM with PostgreSQL schema matching Directus tables
- [ ] Replace DirectusService with direct DB queries
- [ ] Remove Directus Docker container and all Directus SDK dependencies
- [ ] Implement Blindspot Detection feature
- [ ] Build Personal Bias Dashboard ("My News Bias")
- [ ] Add Source Credibility scoring system
- [ ] Expand RSS sources to 50+ feeds
- [ ] CI/CD pipeline: GitHub → VPS auto-deploy

### Phase 2: Growth Features (4-6 weeks)
- [ ] Build PWA / React Native mobile app
- [ ] AI Daily Brief newsletter (personalized)
- [ ] Browser extension (Chrome/Firefox)
- [ ] Custom feeds and topic following (backend)
- [ ] Push notifications for breaking stories
- [ ] Referral system

### Phase 3: Revenue Expansion (4-6 weeks)
- [ ] Launch Asha for Education (institutional accounts)
- [ ] Public API with documentation and rate limiting
- [ ] B2B bias analysis API
- [ ] White-label bias widget for publishers
- [ ] Advanced analytics dashboard for admin

---

## 9. Tech Stack Summary (Target State)

| Component | Current | Target |
|-----------|---------|--------|
| **Frontend** | React 18 + Tailwind + CRA | React 18 + Tailwind (consider Vite migration) |
| **Backend** | Express + Directus proxy | Express + Drizzle ORM (direct DB) |
| **Database** | PostgreSQL (via Directus) | PostgreSQL (direct) |
| **CMS** | Directus | **Removed** — custom admin panel in React |
| **Auth** | Firebase Auth | Firebase Auth (keep — it works) |
| **AI** | Groq + OpenAI + Gemini | Same (Groq primary for cost) |
| **Payments** | Stripe (scaffolded) | Stripe (live) |
| **Hosting** | Netlify + VPS split | Single VPS + Caddy (or keep Netlify for frontend) |
| **CI/CD** | Manual | GitHub Actions auto-deploy |
| **Monitoring** | None | Simple uptime + error logging (Sentry free tier or BetterStack) |

---

## 10. Budget Estimates

### Infrastructure (Monthly)

| Item | Cost |
|------|------|
| VPS (4GB RAM, 2 vCPU — Hetzner/DigitalOcean) | $12-24/mo |
| Domain (asha.news) | Already owned |
| Netlify (frontend, free tier) | $0 |
| Firebase Auth (free tier, up to 50K MAU) | $0 |
| Groq API (free tier generous; paid ~$0.10/1M tokens) | $5-20/mo |
| OpenAI API (fallback only) | $10-30/mo |
| Stripe (2.9% + 30¢ per transaction) | Variable |
| Email (Resend/Postmark free tier for transactional) | $0 |
| **Total infrastructure** | **~$30-75/mo** |

### Development Investment

| Phase | Effort | Solo Dev | With Help |
|-------|--------|----------|-----------|
| Phase 0 (Clean & Ship) | 2-3 weeks | You | You |
| Phase 1 (Replace Directus + Features) | 4-6 weeks | You | You + 1 |
| Phase 2 (Growth Features) | 4-6 weeks | You + 1 | You + 1-2 |
| Phase 3 (Revenue Expansion) | 4-6 weeks | You + 1 | You + 1-2 |

---

## 11. Key Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| **Ground News dominance** | High | Differentiate on Global South coverage, AI-native features, lower pricing |
| **AI API costs spike** | Medium | Use Groq (cheapest), implement caching, fallback to local models (Ollama) |
| **Low paid conversion** | Medium | Start with very low Pro price ($29.99/yr), focus on education vertical for B2B |
| **Content licensing issues** | Low | RSS feeds are public; add proper attribution; avoid full-text scraping |
| **Single developer bottleneck** | High | Keep architecture simple; document everything; consider open-sourcing non-core parts |
| **Directus migration breaks things** | Medium | Export data first; build new layer alongside old; switch over in one deployment |

---

## 12. Decision Points for You

1. **Directus removal**: Do you want to proceed with replacing Directus with direct PostgreSQL access? (Recommended: YES)

2. **Pricing**: Are you comfortable with the Free/Pro($4.99mo)/Premium($9.99mo) tiers, or do you want to match Ground News's ultra-low Pro tier ($9.99/year)?

3. **Mobile**: PWA (cheaper, faster) vs React Native app (better UX, App Store presence)?

4. **Target audience priority**: 
   - (A) General "media-literate" audience (competing with Ground News head-on)
   - (B) Global South / underrepresented perspective audience (unique niche)
   - (C) Education / institutions (B2B first)

5. **Frontend migration**: Stay with Create React App, or migrate to Vite (faster builds, better DX)?

6. **Open source**: Open-source the platform to build community and trust? (AllSides's transparency approach works well for trust)

---

## Summary

Asha.News has a **strong technical foundation** with working AI clustering, bias analysis, and fact-checking that most competitors don't have. The main blockers to launch are:

1. **Directus dependency** adds complexity without proportional value — remove it
2. **No live payment flow** — wire up existing Stripe scaffolding
3. **No mobile presence** — critical for news consumption
4. **No distribution strategy** — build one around YouTube sponsorships + SEO + education

The market is growing (68% of Americans want less bias in news). Ground News has proven the model works but leaves significant gaps. Asha can win by being **more AI-native, more globally inclusive, and more affordable**.

**Recommended immediate next step**: Finish Phase 0 cleanup, wire up Stripe, deploy to asha.news, and start Phase 1 (Directus removal + Blindspot Detection + My News Bias dashboard).
