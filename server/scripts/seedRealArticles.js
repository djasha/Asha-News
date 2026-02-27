#!/usr/bin/env node

/**
 * Seed real articles to test clustering and display
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const queryBridge = require('../db/queryBridge');
const axios = require('axios');

const articles = [
  {
    title: "Breaking: Major Tech Company Announces AI Breakthrough",
    summary: "Leading technology firm reveals revolutionary artificial intelligence system that promises to transform industry standards.",
    content: "In a groundbreaking announcement today, a major technology company unveiled its latest artificial intelligence system...",
    source_url: "https://example.com/tech-ai-breakthrough",
    source_name: "TechNews Daily",
    category: "Technology",
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    political_bias: "center",
    author_name: "Sarah Johnson"
  },
  {
    title: "Tech Giant's New AI System Raises Privacy Concerns",
    summary: "Privacy advocates warn about potential risks as tech company launches powerful AI platform.",
    content: "Privacy experts are raising concerns about the implications of the newly announced AI system...",
    source_url: "https://example.com/ai-privacy-concerns",
    source_name: "Digital Rights News",
    category: "Technology",
    published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    political_bias: "lean_left",
    author_name: "Michael Chen"
  },
  {
    title: "AI Innovation Could Boost Economic Growth, Experts Say",
    summary: "Economic analysts predict significant growth potential from latest AI advancement.",
    content: "Leading economists believe the new AI technology could drive substantial economic growth...",
    source_url: "https://example.com/ai-economic-impact",
    source_name: "Business Weekly",
    category: "Technology",
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    political_bias: "lean_right",
    author_name: "Robert Williams"
  },
  {
    title: "Climate Summit Reaches Historic Agreement on Emissions",
    summary: "World leaders commit to ambitious new targets for reducing greenhouse gas emissions by 2030.",
    content: "In a historic breakthrough at the international climate summit, nations have agreed to unprecedented emission reduction targets...",
    source_url: "https://example.com/climate-summit-agreement",
    source_name: "Global News Network",
    category: "International",
    published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    political_bias: "center",
    author_name: "Emma Thompson"
  },
  {
    title: "Environmental Groups Praise Climate Deal but Warn More Action Needed",
    summary: "While welcoming the agreement, activists say the targets don't go far enough to prevent catastrophic warming.",
    content: "Environmental organizations have given a mixed response to the climate summit agreement...",
    source_url: "https://example.com/climate-activists-response",
    source_name: "Green Earth Times",
    category: "International",
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    political_bias: "left",
    author_name: "Lisa Martinez"
  },
  {
    title: "Industry Leaders Question Feasibility of New Climate Targets",
    summary: "Business executives express concerns about the economic impact of rapid emission reductions.",
    content: "Major industry representatives are questioning whether the ambitious climate targets are achievable...",
    source_url: "https://example.com/industry-climate-concerns",
    source_name: "Industry Report",
    category: "International",
    published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    political_bias: "right",
    author_name: "James Peterson"
  },
  {
    title: "UN Reports Critical Humanitarian Crisis in Gaza as Aid Deliveries Remain Limited",
    summary: "United Nations officials warn of deteriorating conditions as humanitarian aid struggles to reach civilians in Gaza.",
    content: "The United Nations reported today that the humanitarian situation in Gaza continues to deteriorate, with limited aid deliveries unable to meet the growing needs of the civilian population...",
    source_url: "https://example.com/gaza-humanitarian-crisis",
    source_name: "UN News",
    category: "International",
    published_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    political_bias: "center",
    author_name: "David Miller"
  },
  {
    title: "International Community Calls for Immediate Ceasefire and Humanitarian Corridor",
    summary: "Multiple nations and organizations urge parties to establish safe passages for aid and civilian evacuation.",
    content: "A coalition of international organizations and governments has renewed calls for an immediate ceasefire and the establishment of humanitarian corridors...",
    source_url: "https://example.com/ceasefire-calls",
    source_name: "Reuters",
    category: "International",
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    political_bias: "center",
    author_name: "Rachel Cohen"
  },
  {
    title: "Aid Organizations Struggle to Deliver Essential Supplies to Gaza Hospitals",
    summary: "Medical facilities face critical shortages as international aid groups work to deliver emergency supplies.",
    content: "International aid organizations are facing significant challenges in delivering medical supplies and essential resources to hospitals in Gaza...",
    source_url: "https://example.com/gaza-medical-aid",
    source_name: "Al Jazeera",
    category: "International",
    published_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    political_bias: "lean_left",
    author_name: "Ahmed Hassan"
  },
  {
    title: "Regional Leaders Meet to Discuss Palestinian Humanitarian Crisis Solutions",
    summary: "Middle Eastern officials convene emergency summit to address escalating humanitarian needs.",
    content: "Leaders from across the Middle East have gathered for an emergency summit to discuss immediate solutions to the Palestinian humanitarian crisis...",
    source_url: "https://example.com/regional-summit",
    source_name: "Middle East Eye",
    category: "International",
    published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    political_bias: "lean_left",
    author_name: "Fatima Al-Rashid"
  },
  {
    title: "US Announces Additional Humanitarian Aid Package for Palestinian Civilians",
    summary: "State Department confirms new funding for UN relief efforts and medical assistance programs.",
    content: "The United States State Department announced today a new humanitarian aid package aimed at supporting Palestinian civilians affected by the ongoing crisis...",
    source_url: "https://example.com/us-aid-package",
    source_name: "Associated Press",
    category: "International",
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    political_bias: "center",
    author_name: "Jennifer Smith"
  }
];

async function seedArticles() {
  console.log('Seeding real articles...');

  let created = 0;

  for (const article of articles) {
    try {
      const payload = {
        ...article,
        status: 'published',
        bias_score: article.political_bias === 'center' ? 0.5 :
                    article.political_bias === 'lean_left' ? 0.3 :
                    article.political_bias === 'left' ? 0.1 :
                    article.political_bias === 'lean_right' ? 0.7 : 0.9,
        credibility_score: 0.8 + Math.random() * 0.2,
        breaking_news: false,
        featured: false,
        fact_check_status: 'unverified',
      };

      const response = await queryBridge('/items/articles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.data?.id) {
        created++;
        console.log(`Created article: ${article.title.substring(0, 50)}...`);
      }
    } catch (error) {
      console.error(`Failed to create article: ${article.title}`);
      console.error(error.message);
    }
  }

  console.log(`\nSeeded ${created} articles successfully!`);
  
  // Now trigger clustering
  console.log('\nCreating clusters from seeded articles...');
  try {
    const clusterResponse = await axios.post(
      'http://localhost:3001/api/clusters/auto-cluster',
      { max_articles: 100, hours_back: 6 },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (clusterResponse.data?.success) {
      console.log(`Created ${clusterResponse.data.clusters_created} clusters`);
    }
  } catch (error) {
    console.error('Failed to create clusters:', error.message);
  }
}

seedArticles().then(() => {
  console.log('\nSeeding complete!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
