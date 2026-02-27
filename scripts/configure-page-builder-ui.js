const { default: fetch } = require('node-fetch');

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const DIRECTUS_ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;
const DIRECTUS_TOKEN_ENV = process.env.DIRECTUS_TOKEN || null;

if (!DIRECTUS_URL) {
  throw new Error('DIRECTUS_URL must be set in the environment');
}

async function getToken() {
  if (DIRECTUS_TOKEN_ENV) return DIRECTUS_TOKEN_ENV;
  if (!DIRECTUS_ADMIN_EMAIL || !DIRECTUS_ADMIN_PASSWORD) {
    throw new Error('Set DIRECTUS_TOKEN or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD before running this script');
  }
  const res = await fetch(`${DIRECTUS_URL.replace(/\/$/, '')}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: DIRECTUS_ADMIN_EMAIL, password: DIRECTUS_ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data?.data?.access_token;
}

async function directusRequest(path, { method = 'GET', body, token }) {
  const res = await fetch(`${DIRECTUS_URL.replace(/\/$/, '')}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function run() {
  try {
    const token = await getToken();

    // Configure pages.components as a repeater with friendly subfields
    const componentChoices = [
      { text: 'Hero', value: 'hero' },
      { text: 'Hero (Cluster)', value: 'hero_cluster' },
      { text: 'Story Clusters', value: 'story_clusters' },
      { text: 'News Feed', value: 'news_feed' },
      { text: 'Daily Briefs', value: 'daily_briefs' },
      { text: 'Trending Grid', value: 'trending_grid' },
      { text: 'Image Board', value: 'image_board' },
      { text: 'AI Analysis Section', value: 'analysis_section' },
      { text: 'Topic Carousel', value: 'topic_carousel' },
      { text: 'Gaza/Israel News', value: 'gaza_israel_news' },
      { text: 'Latest From Asha', value: 'latest_from_asha' },
      { text: 'Custom HTML', value: 'custom_html' },
      { text: 'Embed (iframe)', value: 'embed' },
    ];

    const repeaterMeta = {
      interface: 'repeater',
      options: {
        addLabel: 'Add Section',
        fields: [
          {
            field: 'component_type',
            name: 'Component Type',
            type: 'string',
            meta: {
              interface: 'select-dropdown',
              required: true,
              options: { choices: componentChoices },
            },
          },
          {
            field: 'title',
            name: 'Title (optional)',
            type: 'string',
            meta: { interface: 'input' },
          },
          {
            field: 'enabled',
            name: 'Enabled',
            type: 'boolean',
            meta: { interface: 'boolean', default_value: true },
          },
          {
            field: 'sort_order',
            name: 'Sort Order',
            type: 'integer',
            meta: { interface: 'input' },
          },
          // Common styling controls
          {
            field: 'title_align',
            name: 'Title Align',
            type: 'string',
            meta: {
              interface: 'select-dropdown',
              options: { choices: [
                { text: 'Left', value: 'left' },
                { text: 'Center', value: 'center' },
                { text: 'Right', value: 'right' },
              ]},
            },
          },
          {
            field: 'title_size',
            name: 'Title Size',
            type: 'string',
            meta: {
              interface: 'select-dropdown',
              options: { choices: [
                { text: 'XL', value: 'xl' },
                { text: '2XL', value: '2xl' },
                { text: '3XL', value: '3xl' },
                { text: '4XL', value: '4xl' },
              ]},
            },
          },
          {
            field: 'color_preset',
            name: 'Color Preset',
            type: 'string',
            meta: {
              interface: 'select-dropdown',
              options: { choices: [
                { text: 'Default', value: 'default' },
                { text: 'Light', value: 'light' },
                { text: 'Dark', value: 'dark' },
                { text: 'Neutral', value: 'neutral' },
                { text: 'Accent', value: 'accent' },
                { text: 'Brand', value: 'brand' },
              ]},
            },
          },
          {
            field: 'bg_color',
            name: 'Background Class (optional)',
            type: 'string',
            meta: { interface: 'input', options: { placeholder: 'e.g., bg-white dark:bg-black' } },
          },
          {
            field: 'title_color',
            name: 'Title Color Class (optional)',
            type: 'string',
            meta: { interface: 'input', options: { placeholder: 'e.g., text-slate-900 dark:text-slate-100' } },
          },
          {
            field: 'text_color',
            name: 'Text Color Class (optional)',
            type: 'string',
            meta: { interface: 'input', options: { placeholder: 'e.g., text-slate-700 dark:text-slate-300' } },
          },
          {
            field: 'section_classes',
            name: 'Section Classes',
            type: 'string',
            meta: { interface: 'input' },
          },
          {
            field: 'text_classes',
            name: 'Text Classes',
            type: 'string',
            meta: { interface: 'input' },
          },
          // News Feed controls (conditional)
          {
            field: 'show_sidebar',
            name: 'Show Sidebar',
            type: 'boolean',
            meta: {
              interface: 'boolean',
              conditions: [
                { rule: { _and: [{ component_type: { _eq: 'news_feed' } }] }, hidden: false },
              ],
            },
          },
          {
            field: 'feed_classes',
            name: 'Feed Classes',
            type: 'string',
            meta: {
              interface: 'input',
              conditions: [
                { rule: { _and: [{ component_type: { _eq: 'news_feed' } }] }, hidden: false },
              ],
            },
          },
          // Embed controls (conditional)
          {
            field: 'src',
            name: 'Embed URL',
            type: 'string',
            meta: {
              interface: 'input',
              options: { placeholder: 'https://…' },
              conditions: [ { rule: { _and: [{ component_type: { _eq: 'embed' } }] }, hidden: false } ],
            },
          },
          {
            field: 'height',
            name: 'Embed Height (px)',
            type: 'integer',
            meta: {
              interface: 'input',
              options: { min: 100, step: 10 },
              conditions: [ { rule: { _and: [{ component_type: { _eq: 'embed' } }] }, hidden: false } ],
            },
          },
          {
            field: 'allow',
            name: 'Allow (iframe)',
            type: 'string',
            meta: {
              interface: 'input',
              options: { placeholder: 'accelerometer; autoplay; …' },
              conditions: [ { rule: { _and: [{ component_type: { _eq: 'embed' } }] }, hidden: false } ],
            },
          },
          {
            field: 'sandbox',
            name: 'Sandbox (iframe)',
            type: 'string',
            meta: {
              interface: 'input',
              options: { placeholder: 'allow-scripts allow-same-origin …' },
              conditions: [ { rule: { _and: [{ component_type: { _eq: 'embed' } }] }, hidden: false } ],
            },
          },
          {
            field: 'referrerpolicy',
            name: 'Referrer Policy',
            type: 'string',
            meta: {
              interface: 'input',
              options: { placeholder: 'no-referrer-when-downgrade' },
              conditions: [ { rule: { _and: [{ component_type: { _eq: 'embed' } }] }, hidden: false } ],
            },
          },
          {
            field: 'settings',
            name: 'Settings (JSON)',
            type: 'json',
            meta: { interface: 'input-code', options: { language: 'json' } },
          },
        ],
      },
    };

    const patchBody = {
      meta: repeaterMeta,
      type: 'json',
      schema: { is_nullable: true },
    };

    await directusRequest('/fields/pages/components', { method: 'PATCH', body: patchBody, token });
    console.log('✅ Configured pages.components as repeater with UI fields');

    console.log('\nVisual editor UI enhancements complete.');
  } catch (err) {
    console.error('Failed to configure page builder UI:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}
