const { createDirectus, rest, staticToken, createItem } = require('@directus/sdk');

const DIRECTUS_URL = 'http://168.231.111.192:8055';
const DIRECTUS_TOKEN = 'rwK92lpHPcnQZR7Di-PmCxuwe33P8G9z';

const client = createDirectus(DIRECTUS_URL).with(rest()).with(staticToken(DIRECTUS_TOKEN));

const palestineArticles = [
  {
    title: 'Gaza Platform: Mass Displacement Documentation',
    content: 'Forensic Architecture documents the mass displacement of Palestinian civilians carried out by the Israeli military in the Gaza Strip since October 7, 2023, identifying three overlapping phases in its execution.',
    url: 'https://gaza.forensic-architecture.org/databaseA',
    published: true,
    article_type: 'investigation',
    political_bias: 'center-left',
    byline: 'Forensic Architecture',
    source_id: 1,
    topic_category_id: 1,
    featured: true,
    credibility_score: 9.5,
    difficulty_score: 0.85
  },
  {
    title: 'Lethal Aid: Documentation of Military Support',
    content: 'Investigation into lethal aid and military support systems affecting Palestinian territories.',
    url: 'https://gaza.forensic-architecture.org/databaseA',
    published: true,
    article_type: 'investigation',
    political_bias: 'center-left',
    byline: 'Forensic Architecture',
    source_id: 1,
    topic_category_id: 1,
    featured: false,
    credibility_score: 9.3,
    difficulty_score: 0.80
  },
  {
    title: 'Humanitarian Violence: Abuse of Protection Measures',
    content: 'Analysis of how humanitarian protection measures have been systematically abused, putting Palestinian civilians at risk.',
    url: 'https://gaza.forensic-architecture.org/databaseA',
    published: true,
    article_type: 'investigation',
    political_bias: 'center-left',
    byline: 'Forensic Architecture',
    source_id: 1,
    topic_category_id: 1,
    featured: true,
    credibility_score: 9.4,
    difficulty_score: 0.82
  },
  {
    title: 'Destruction of Medical Infrastructure',
    content: 'Comprehensive documentation of attacks on medical facilities and healthcare infrastructure in Palestinian territories.',
    url: 'https://gaza.forensic-architecture.org/databaseA',
    published: true,
    article_type: 'investigation',
    political_bias: 'center-left',
    byline: 'Forensic Architecture',
    source_id: 1,
    topic_category_id: 1,
    featured: true,
    credibility_score: 9.6,
    difficulty_score: 0.88
  },
  {
    title: 'Ecocide in Gaza: Environmental Destruction Investigation',
    content: 'Investigation into environmental destruction and ecocide in Gaza, examining the systematic targeting of environmental infrastructure.',
    url: 'https://gaza.forensic-architecture.org/databaseA',
    published: true,
    article_type: 'investigation',
    political_bias: 'center-left',
    byline: 'Forensic Architecture',
    source_id: 1,
    topic_category_id: 1,
    featured: true,
    credibility_score: 9.5,
    difficulty_score: 0.86
  },
  {
    title: 'Design by Destruction: Spatial Analysis',
    content: 'Spatial analysis investigation examining patterns of destruction and their impact on Palestinian urban environments.',
    url: 'https://gaza.forensic-architecture.org/databaseA',
    published: true,
    article_type: 'investigation',
    political_bias: 'center-left',
    byline: 'Forensic Architecture',
    source_id: 1,
    topic_category_id: 1,
    featured: false,
    credibility_score: 9.4,
    difficulty_score: 0.84
  }
];

async function addPalestineArticles() {
  try {
    console.log('Adding Palestine articles to Directus CMS...');
    
    for (const article of palestineArticles) {
      try {
        const result = await client.request(createItem('articles', article));
        console.log(`✓ Added: ${article.title}`);
      } catch (error) {
        console.log(`✗ Failed to add: ${article.title} - ${error.message}`);
      }
    }
    
    console.log('\nPalestine articles added to Directus CMS for admin editing!');
    console.log('You can now edit them at: http://168.231.111.192:8055/admin/content/articles');
  } catch (error) {
    console.error('Error adding Palestine articles:', error.message);
  }
}

addPalestineArticles();
