const { createDirectus, rest, createItem, readItems } = require('@directus/sdk');

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  throw new Error('DIRECTUS_URL and DIRECTUS_TOKEN must be set in the environment');
}

const client = createDirectus(DIRECTUS_URL).auth(DIRECTUS_TOKEN).with(rest());

async function addPalestineCategory() {
  try {
    // Check if Palestine category already exists
    const existingCategories = await client.request(readItems('topic_categories', {
      filter: {
        name: {
          _eq: 'Palestine'
        }
      }
    }));

    if (existingCategories.length > 0) {
      console.log('Palestine category already exists');
      return existingCategories[0];
    }

    // Create Palestine category
    const palestineCategory = await client.request(createItem('topic_categories', {
      name: 'Palestine',
      slug: 'palestine',
      description: 'Forensic investigations and reports on Palestine from Forensic Architecture and other sources',
      color: '#d32f2f', // Red color for Palestine
      icon: 'location_on',
      sort_order: 10,
      status: 'published'
    }));

    console.log('Palestine category created successfully:', palestineCategory);
    return palestineCategory;

  } catch (error) {
    console.error('Error creating Palestine category:', error);
    throw error;
  }
}

module.exports = { addPalestineCategory };

// Run if called directly
if (require.main === module) {
  addPalestineCategory()
    .then(() => {
      console.log('Palestine category setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to setup Palestine category:', error);
      process.exit(1);
    });
}
