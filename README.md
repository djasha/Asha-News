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
- **Backend**: Node.js, Express (planned)
- **Database**: PostgreSQL (planned)
- **AI**: OpenAI GPT-4 API
- **Deployment**: TBD

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/asha-news.git
cd asha-news
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

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

## 🔧 Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## 📋 Development Roadmap

See [todo.md](./todo.md) for detailed development phases and task breakdown.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📞 Contact

For questions or support, please open an issue on GitHub.
