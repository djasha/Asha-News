#!/usr/bin/env node
/**
 * Seed Categories - Populate default categories in Directus
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const DirectusService = require('../services/directusService');
const directus = new DirectusService();

const categories = [
  { name: 'Politics', slug: 'politics', description: 'Political news and analysis', color: '#dc2626', icon: 'government', order: 1, enabled: true, featured: true },
  { name: 'Technology', slug: 'technology', description: 'Tech news, startups, and innovation', color: '#2563eb', icon: 'computer', order: 2, enabled: true, featured: true },
  { name: 'Business', slug: 'business', description: 'Business, economy, and markets', color: '#059669', icon: 'trending_up', order: 3, enabled: true, featured: true },
  { name: 'International', slug: 'international', description: 'World news and global affairs', color: '#7c3aed', icon: 'public', order: 4, enabled: true, featured: true },
  { name: 'Health', slug: 'health', description: 'Health, medicine, and wellness', color: '#dc2626', icon: 'favorite', order: 5, enabled: true, featured: false },
  { name: 'Sports', slug: 'sports', description: 'Sports news and updates', color: '#ea580c', icon: 'sports', order: 6, enabled: true, featured: false },
  { name: 'Entertainment', slug: 'entertainment', description: 'Movies, music, and culture', color: '#db2777', icon: 'movie', order: 7, enabled: true, featured: false },
  { name: 'Science', slug: 'science', description: 'Science, research, and discovery', color: '#0891b2', icon: 'science', order: 8, enabled: true, featured: false }
];

async function seedCategories() {
  console.log('🌱 Seeding categories...\n');
  
  let created = 0;
  let skipped = 0;
  
  for (const cat of categories) {
    try {
      // Check if category already exists
      const existing = await directus.getItems('categories', {
        filter: { slug: { _eq: cat.slug } },
        limit: 1
      });
      
      if (existing && existing.length > 0) {
        console.log(`⚠️  Skipped: ${cat.name} (already exists)`);
        skipped++;
        continue;
      }
      
      await directus.createItem('categories', cat);
      console.log(`✓ Created: ${cat.name}`);
      created++;
    } catch (error) {
      console.error(`✗ Failed: ${cat.name}`, error.message);
    }
  }
  
  console.log(`\n✅ Done! Created: ${created}, Skipped: ${skipped}`);
}

seedCategories().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
