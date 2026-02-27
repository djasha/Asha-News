#!/usr/bin/env node

// Quick fix to test and ensure CMS endpoints work with fallback data
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002; // Use different port to avoid conflicts

// Sample articles endpoint with guaranteed fallback
app.get('/api/cms/articles', (req, res) => {
  console.log('Articles endpoint called');
  
  try {
    const sampleDataPath = path.join(__dirname, 'public', 'data', 'sample-articles.json');
    console.log('Looking for sample data at:', sampleDataPath);
    
    if (fs.existsSync(sampleDataPath)) {
      const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
      console.log('Sample data loaded, articles count:', sampleData.articles?.length || 0);
      
      res.json({
        articles: sampleData.articles || [],
        total: sampleData.articles?.length || 0,
        fetched_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        source: 'sample_data'
      });
    } else {
      console.log('Sample data file not found, using hardcoded fallback');
      res.json({
        articles: [
          {
            id: 'cms-1',
            title: 'Breaking: Major Tech Innovation Announced',
            summary: 'A groundbreaking technological advancement promises to revolutionize the industry.',
            content: 'In a significant development that could reshape the technology landscape...',
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
            featured: true,
            status: 'published'
          }
        ],
        total: 1,
        fetched_at: new Date().toISOString(),
        source: 'hardcoded_fallback'
      });
    }
  } catch (error) {
    console.error('Error in articles endpoint:', error);
    res.status(500).json({ error: 'Failed to load articles', details: error.message });
  }
});

// Sample trending topics endpoint
app.get('/api/cms/trending-topics', (req, res) => {
  console.log('Trending topics endpoint called');
  
  try {
    const sampleDataPath = path.join(__dirname, 'public', 'data', 'sample-trending-topics.json');
    
    if (fs.existsSync(sampleDataPath)) {
      const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
      res.json({
        data: sampleData.data || [],
        meta: { total_count: sampleData.data?.length || 0 },
        source: 'sample_data'
      });
    } else {
      res.json({
        data: [
          {
            id: 1,
            name: 'Artificial Intelligence',
            slug: 'artificial-intelligence',
            description: 'Latest developments in AI technology',
            trend_score: 95,
            article_count: 45,
            category: 'Technology',
            status: 'active',
            featured: true
          }
        ],
        meta: { total_count: 1 },
        source: 'hardcoded_fallback'
      });
    }
  } catch (error) {
    console.error('Error in trending topics endpoint:', error);
    res.status(500).json({ error: 'Failed to load trending topics', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Test CMS server running on port ${PORT}`);
  console.log(`📊 Test endpoints:`);
  console.log(`   - http://localhost:${PORT}/api/cms/articles`);
  console.log(`   - http://localhost:${PORT}/api/cms/trending-topics`);
  console.log(`   - http://localhost:${PORT}/api/health`);
});
