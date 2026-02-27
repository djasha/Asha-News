#!/usr/bin/env node

/**
 * Import RSS sources from OPML file into the database.
 * Updated: uses queryBridge instead of Directus API.
 */

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const queryBridge = require('../db/queryBridge');

const OPML_FILE = path.join(__dirname, '../../asha-sources.opml');

async function parseOPML() {
  const opmlContent = fs.readFileSync(OPML_FILE, 'utf-8');
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(opmlContent);
  
  const sources = [];
  const outlines = result.opml.body[0].outline || [];
  
  outlines.forEach(category => {
    const categoryName = category.$.text || 'general';
    if (category.outline) {
      category.outline.forEach(feed => {
        if (feed.$.type === 'rss') {
          sources.push({
            name: feed.$.title || feed.$.text,
            rss_url: feed.$.xmlUrl,
            category: categoryName,
            enabled: true,
            credibility_score: 0.8,
            domain: new URL(feed.$.xmlUrl).hostname
          });
        }
      });
    }
  });
  
  return sources;
}

async function importSources() {
  console.log('Importing RSS sources from OPML...\n');

  try {
    const sources = await parseOPML();
    console.log(`Found ${sources.length} RSS sources in OPML file\n`);

    let imported = 0;
    let updated = 0;
    let failed = 0;

    for (const source of sources) {
      try {
        const existing = await queryBridge(`/items/rss_sources?filter[url][_eq]=${encodeURIComponent(source.rss_url)}&limit=1`);

        if (existing.data?.length > 0) {
          await queryBridge(`/items/rss_sources/${existing.data[0].id}`, {
            method: 'PATCH',
            body: JSON.stringify(source),
          });
          updated++;
          console.log(`Updated: ${source.name}`);
        } else {
          await queryBridge('/items/rss_sources', {
            method: 'POST',
            body: JSON.stringify(source),
          });
          imported++;
          console.log(`Imported: ${source.name}`);
        }
      } catch (error) {
        failed++;
        console.error(`Failed: ${source.name} - ${error.message}`);
      }
    }

    console.log('\nImport Summary:');
    console.log(`   Imported: ${imported} new sources`);
    console.log(`   Updated: ${updated} existing sources`);
    console.log(`   Failed: ${failed} sources`);
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  importSources();
}

module.exports = { parseOPML, importSources };
