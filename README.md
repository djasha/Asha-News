# Asha.News

AI-powered news aggregation platform that combats media bias by providing balanced, transparent news consumption from multiple perspectives.

## 🎯 Project Overview

Asha.News is similar to Ground News but enhanced with AI analysis to help users identify media bias, discover blindspots in coverage, and consume news from diverse perspectives.

## ✨ Features

### Core Features (MVP)
- **News Aggregation Engine** - RSS feed monitoring from 200+ sources
- **AI Bias Analysis** - OpenAI GPT-4 analysis for political bias, emotional tone, factual quality
- **Story Clustering** - Group related articles from different perspectives
- **Personalized Feed** - User preferences balanced with diversity goals
- **Source Transparency** - Comprehensive source information and bias ratings
- **Fact Checker** - Claim verification and evidence analysis tools
- **Blindspot Detection** - Identify stories covered by only one political side

### Design System
- **Responsive Design** - Mobile-first approach scaling to wide screens
- **Light/Dark Mode** - Seamless theme switching with user preference persistence
- **Bias Visualizations** - Interactive charts and indicators for bias analysis
- **Accessibility** - WCAG 2.1 AA compliant with keyboard navigation support

## 🛠 Tech Stack

- **Frontend**: React 18, Tailwind CSS, React Router
- **Backend**: Node.js, Express, REST APIs
- **Database**: Directus CMS (self-hosted via Docker)
- **AI**: Groq, OpenRouter, Perplexity, OpenAI (configurable providers)
- **Deployment**: Netlify (frontend), TBD (backend)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Directus instance (self-hosted or remote)

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/asha-news.git
cd asha-news
```

2. Install dependencies (applies to both frontend and backend workspaces):
```bash
npm install
```

3. Configure environment variables in `server/.env`:
```env
PORT=3001
DIRECTUS_URL=http://localhost:8055
DIRECTUS_TOKEN=your_directus_static_token

# AI provider keys (optional but recommended)
GROQ_API_KEY=
OPENROUTER_API_KEY=
PERPLEXITY_API_KEY=
OPENAI_API_KEY=
```

4. Start both servers via helper script (recommended):
```bash
./start-all.sh
```
This launches the backend (`http://localhost:3001`) and frontend (`http://localhost:3000`).

5. Verify the key routes:
- Frontend stories: `http://localhost:3000/stories`
- Admin settings: `http://localhost:3000/admin`
- Backend health: `http://localhost:3001/api/health`

### Testing

Run the end-to-end content-hash caching suite:
```bash
node server/tests/content-hash-cache.test.js
```
The script exercises the Q&A, fact-check, and analysis endpoints to ensure cached responses are returned when cluster content is unchanged.

## 📱 Responsive Breakpoints

- **Mobile**: 320-767px (single column, hamburger menu)
- **Tablet**: 768-1023px (two-column layout)
- **Desktop**: 1024-1439px (three-column layout)
- **Wide**: 1440px+ (multi-column with sidebar)

## 🎨 Design System

### Color Palette
- **Light Mode**: Clean whites and slate grays for optimal readability
- **Dark Mode**: Deep slate backgrounds with high contrast text
- **Bias Colors**: Red (left), Green (center), Blue (right), Purple (mixed)

### Typography
- **Font**: Inter with system fallbacks
- **Responsive Scaling**: 24px → 36px headlines across breakpoints
- **Line Heights**: Optimized for readability (1.2-1.6)

## 📊 Bias Visualization Components

- **BiasBar**: Horizontal distribution bars showing left/center/right coverage
- **BiasIndicator**: Compact circular indicators with unique shapes
- **CoverageChart**: Donut charts for story coverage analysis
- **CredibilityMeter**: Star ratings for source credibility

## ⚙️ Admin Settings

### Clustering & Stories Configuration

The admin panel (`/admin/settings`) provides fine-grained control over story clustering and presentation:

#### Clustering Settings
- **Similarity Threshold** (0.0-1.0): Controls how similar articles need to be to cluster together
- **Max Cluster Size**: Maximum number of articles per cluster
- **Min Articles to Publish**: Minimum articles required to form a publishable cluster
- **Save to Directus**: Whether to persist clusters to the CMS
- **Keep Individual Articles**: Enable/disable individual article links in clusters

#### Story Presentation
- **Show Bias Charts**: Toggle bias distribution visualizations
- **Show Perspectives**: Toggle source perspective indicators
- **Show Q&A**: Toggle AI-generated questions and answers
- **Show Key Facts**: Toggle extracted key facts section
- **Sources per Cluster**: Limit number of sources displayed
- **Summary Max Characters**: Truncate summaries to specified length

## 🔧 Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run server` - Runs the backend server
- `npm run dev:full` - Runs both frontend and backend concurrently

## 📋 Development Roadmap

See [todo.md](./todo.md) for detailed development phases and task breakdown.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📞 Contact

For questions or support, please open an issue on GitHub.
