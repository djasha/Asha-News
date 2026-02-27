// Utility helpers for RSS ingestion
// Keep this file dependency-free for easy testing

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function normalizeUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  try {
    const u = new URL(raw);
    const drop = new Set([
      'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
      'utm_name','utm_cid','utm_reader','utm_viz_id','utm_pubreferrer',
      'gclid','fbclid','mc_cid','mc_eid','igshid'
    ]);
    [...u.searchParams.keys()].forEach(k => { if (drop.has(k)) u.searchParams.delete(k); });
    u.hostname = u.hostname.toLowerCase();
    return u.toString();
  } catch {
    return String(raw).trim();
  }
}

function slugifyTag(label) {
  if (!label) return '';
  return String(label).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function dedupeByUrlHash(items, seenSet = new Set()) {
  const uniqueItems = [];
  for (const art of items || []) {
    const uhash = art.url_hash || hash(art.url || art.id || '');
    if (uhash && !seenSet.has(uhash)) {
      seenSet.add(uhash);
      uniqueItems.push(art);
    }
  }
  return { uniqueItems, seenSet };
}

module.exports = {
  hash,
  normalizeUrl,
  slugifyTag,
  dedupeByUrlHash,
};
