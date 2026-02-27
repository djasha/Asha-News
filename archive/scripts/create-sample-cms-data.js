// Create sample CMS data for testing frontend display
const fs = require('fs');
const path = require('path');

// Sample articles data
const sampleArticles = [
  {
    id: 'cms-1',
    title: 'Breaking: Major Tech Innovation Announced',
    summary: 'A groundbreaking technological advancement promises to revolutionize the industry with unprecedented capabilities and efficiency improvements.',
    content: 'In a significant development that could reshape the technology landscape, industry leaders have unveiled a revolutionary innovation that promises to transform how we interact with digital systems. The breakthrough technology demonstrates remarkable efficiency improvements and opens new possibilities for future applications.',
    url: 'https://technewsdaily.com/breaking-innovation',
    slug: 'breaking-tech-innovation-announced',
    publication_date: '2024-01-15T10:00:00Z',
    source_id: 'tech_news_daily',
    source_name: 'Tech News Daily',
    political_bias: 'center',
    topic: 'Technology',
    section: 'featured',
    author: 'Asha News',
    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800',
    factual_quality: 0.9,
    confidence_score: 0.9,
    ai_analysis: 'High credibility technology news with balanced reporting',
    bias_score: 0.5,
    fact_check_status: 'verified',
    view_count: 1250,
    share_count: 89,
    featured: true,
    status: 'published'
  },
  {
    id: 'cms-2',
    title: 'Global Climate Summit Reaches Historic Agreement',
    summary: 'World leaders unite on comprehensive climate action plan with ambitious targets for carbon reduction and renewable energy adoption.',
    content: 'After days of intense negotiations, representatives from over 190 countries have reached a landmark agreement on climate action. The comprehensive plan includes specific targets for carbon emission reductions, renewable energy adoption, and financial support for developing nations to transition to sustainable practices.',
    url: 'https://globalnews.com/climate-summit-agreement',
    slug: 'climate-summit-historic-agreement',
    publication_date: '2024-01-14T14:30:00Z',
    source_id: 'global_news_network',
    source_name: 'Global News Network',
    political_bias: 'center-left',
    topic: 'Environment',
    section: 'featured',
    author: 'Asha News',
    image_url: 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=800',
    factual_quality: 0.95,
    confidence_score: 0.95,
    ai_analysis: 'Comprehensive environmental reporting with strong factual basis',
    bias_score: 0.4,
    fact_check_status: 'verified',
    view_count: 2100,
    share_count: 156,
    featured: true,
    status: 'published'
  },
  {
    id: 'cms-3',
    title: 'Economic Markets Show Strong Recovery Signs',
    summary: 'Financial analysts report positive indicators as markets demonstrate resilience and growth potential across multiple sectors.',
    content: 'Recent economic data reveals encouraging trends as markets continue to show signs of robust recovery. Key indicators including employment rates, consumer spending, and business investment have all demonstrated positive momentum, suggesting sustained economic growth in the coming quarters.',
    url: 'https://financialtimes.com/market-recovery',
    slug: 'economic-markets-recovery-signs',
    publication_date: '2024-01-13T09:15:00Z',
    source_id: 'financial_times',
    source_name: 'Financial Times',
    political_bias: 'center',
    topic: 'Business',
    section: 'general',
    author: 'Asha News',
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    factual_quality: 0.88,
    confidence_score: 0.88,
    ai_analysis: 'Balanced economic analysis with credible sources',
    bias_score: 0.3,
    fact_check_status: 'verified',
    view_count: 890,
    share_count: 67,
    featured: false,
    status: 'published'
  },
  {
    id: 'cms-4',
    title: 'Healthcare Breakthrough: New Treatment Shows Promise',
    summary: 'Medical researchers announce significant progress in treating a previously challenging condition with innovative therapeutic approach.',
    content: 'A team of international researchers has made a significant breakthrough in medical treatment, developing an innovative approach that shows remarkable promise for patients with previously difficult-to-treat conditions. Clinical trials have demonstrated exceptional results with minimal side effects.',
    url: 'https://medicaljournal.com/breakthrough-treatment',
    slug: 'healthcare-breakthrough-new-treatment',
    publication_date: '2024-01-12T16:45:00Z',
    source_id: 'medical_journal_today',
    source_name: 'Medical Journal Today',
    political_bias: 'center',
    topic: 'Health',
    section: 'featured',
    author: 'Asha News',
    image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
    factual_quality: 0.92,
    confidence_score: 0.92,
    ai_analysis: 'High-quality medical reporting with peer-reviewed sources',
    bias_score: 0.2,
    fact_check_status: 'verified',
    view_count: 1560,
    share_count: 203,
    featured: true,
    status: 'published'
  }
];

// Sample trending topics data
const sampleTrendingTopics = [
  {
    id: 1,
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    description: 'Latest developments in AI technology and applications',
    trend_score: 95,
    article_count: 45,
    category: 'Technology',
    status: 'active',
    featured: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Climate Change',
    slug: 'climate-change',
    description: 'Environmental news and climate action updates',
    trend_score: 88,
    article_count: 32,
    category: 'Environment',
    status: 'active',
    featured: true,
    created_at: '2024-01-14T10:00:00Z',
    updated_at: '2024-01-14T10:00:00Z'
  },
  {
    id: 3,
    name: 'Economic Recovery',
    slug: 'economic-recovery',
    description: 'Market trends and economic analysis',
    trend_score: 76,
    article_count: 28,
    category: 'Business',
    status: 'active',
    featured: false,
    created_at: '2024-01-13T10:00:00Z',
    updated_at: '2024-01-13T10:00:00Z'
  },
  {
    id: 4,
    name: 'Healthcare Innovation',
    slug: 'healthcare-innovation',
    description: 'Medical breakthroughs and health technology',
    trend_score: 82,
    article_count: 19,
    category: 'Health',
    status: 'active',
    featured: true,
    created_at: '2024-01-12T10:00:00Z',
    updated_at: '2024-01-12T10:00:00Z'
  }
];

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'public', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write sample data files
fs.writeFileSync(
  path.join(dataDir, 'sample-articles.json'),
  JSON.stringify({ articles: sampleArticles, total: sampleArticles.length, fetched_at: new Date().toISOString() }, null, 2)
);

fs.writeFileSync(
  path.join(dataDir, 'sample-trending-topics.json'),
  JSON.stringify({ data: sampleTrendingTopics, meta: { total_count: sampleTrendingTopics.length } }, null, 2)
);

console.log('✅ Sample CMS data files created successfully!');
console.log('📁 Files created:');
console.log('  - public/data/sample-articles.json');
console.log('  - public/data/sample-trending-topics.json');
console.log('🔄 Backend API will now return this sample data when Directus is unavailable.');
