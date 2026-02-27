const { default: fetch } = require('node-fetch');

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const DIRECTUS_ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;
const DIRECTUS_TOKEN_ENV = process.env.DIRECTUS_TOKEN || null;

if (!DIRECTUS_URL) {
  throw new Error('DIRECTUS_URL must be set in the environment');
}

// Helper: Directus API wrapper
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

async function getToken() {
  if (DIRECTUS_TOKEN_ENV) {
    console.log('Using DIRECTUS_TOKEN from environment');
    return DIRECTUS_TOKEN_ENV;
  }
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

async function findPageBySlug(slug, token) {
  const qs = `?filter[slug][_eq]=${encodeURIComponent(slug)}&limit=1`;
  const data = await directusRequest(`/items/pages${qs}`, { token });
  const arr = data?.data || [];
  return arr[0] || null;
}

async function createOrUpdatePage({ title, slug, components, layout_settings, seo_title, seo_description }, token) {
  const existing = await findPageBySlug(slug, token);
  if (!existing) {
    const payload = {
      title,
      slug,
      status: 'published',
      components,
      layout_settings: layout_settings || { container_width: 'contained', spacing: 'normal', background: 'default' },
      seo_title: seo_title || title,
      seo_description: seo_description || `${title} - Asha.News`,
    };
    const result = await directusRequest('/items/pages', { method: 'POST', body: payload, token });
    console.log(`Created page '${slug}' (id=${result?.data?.id})`);
    return result?.data;
  }
  // Only fill if empty or status not published; avoid overwriting editor content
  const needsUpdate = !existing.components || existing.components.length === 0 || existing.status !== 'published';
  if (!needsUpdate) {
    console.log(`Skipping update for '${slug}' (already published with components)`);
    return existing;
  }
  const update = {
    status: 'published',
    components: existing.components && existing.components.length > 0 ? existing.components : components,
    layout_settings: existing.layout_settings || layout_settings || { container_width: 'contained' },
    seo_title: existing.seo_title || seo_title || title,
    seo_description: existing.seo_description || seo_description || `${title} - Asha.News`,
  };
  const result = await directusRequest(`/items/pages/${existing.id}`, { method: 'PATCH', body: update, token });
  console.log(`Updated page '${slug}' (id=${existing.id})`);
  return result?.data;
}

function htmlBlock(html, classes = '') {
  return { type: 'custom_html', enabled: true, sort_order: 1, settings: { html_content: html, css_classes: classes } };
}

async function run() {
  try {
    const token = await getToken();

    // About page
    await createOrUpdatePage({
      title: 'About',
      slug: 'about',
      components: [
        htmlBlock(`
          <h1>About Asha.News</h1>
          <p>Asha.News helps readers compare coverage across the spectrum with AI-powered bias analysis and story clustering.</p>
        `),
        { type: 'latest_from_asha', enabled: true, sort_order: 2, settings: { limit: 5 } },
      ],
      layout_settings: { container_width: 'contained', spacing: 'normal' },
    }, token);

    // Features page
    await createOrUpdatePage({
      title: 'Features',
      slug: 'features',
      components: [
        htmlBlock(`
          <h1>Platform Features</h1>
          <ul>
            <li>AI-powered bias analysis</li>
            <li>Story clustering with multiple perspectives</li>
            <li>Fact-check search and credibility insights</li>
          </ul>
        `),
        { type: 'analysis_section', enabled: true, sort_order: 2, settings: {} },
        { type: 'topic_carousel', enabled: true, sort_order: 3, settings: {} },
      ],
      layout_settings: { container_width: 'contained' },
    }, token);

    // Contact page
    await createOrUpdatePage({
      title: 'Contact',
      slug: 'contact',
      components: [
        htmlBlock(`
          <h1>Contact Us</h1>
          <p>Email: <a href="mailto:contact@asha.news">contact@asha.news</a></p>
        `),
      ],
      layout_settings: { container_width: 'contained' },
    }, token);

    // API page
    await createOrUpdatePage({
      title: 'API',
      slug: 'api',
      components: [
        htmlBlock(`
          <h1>Asha.News API</h1>
          <p>Our API provides access to story clusters, articles, and analysis metadata.</p>
        `),
        { type: 'news_feed', enabled: true, sort_order: 2, settings: { layout: 'grid', articles_per_page: 20, show_filters: false } },
      ],
      layout_settings: { container_width: 'contained' },
    }, token);

    // Careers page
    await createOrUpdatePage({
      title: 'Careers',
      slug: 'careers',
      components: [
        htmlBlock(`
          <h1>Careers at Asha.News</h1>
          <p>We are building AI-powered tools to help readers understand the news better. Join us.</p>
        `),
        { type: 'custom_html', enabled: true, sort_order: 2, settings: { html_content: '<h2>Open Roles</h2><p>No open roles at this time. Check back soon.</p>' } },
      ],
      layout_settings: { container_width: 'contained' },
    }, token);

    console.log('\nAll requested pages created/updated.');
  } catch (err) {
    console.error('Failed to create initial pages:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}
