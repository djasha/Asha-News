function timeframeToMs(timeframe) {
  switch (String(timeframe || '').toLowerCase()) {
    case '1h':
      return 60 * 60 * 1000;
    case '6h':
      return 6 * 60 * 60 * 1000;
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '3d':
      return 3 * 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

function includesIgnoreCase(value, query) {
  return String(value || '').toLowerCase().includes(String(query || '').toLowerCase());
}

export function applyUnifiedFilters(items, filters = {}) {
  if (!Array.isArray(items)) return [];
  const now = Date.now();
  const timeframeMs = timeframeToMs(filters.timeframe);

  return items.filter((item) => {
    if (filters.topic) {
      const topicHaystack = [
        item.topic,
        item.category,
        item.title,
        item.summary,
      ].filter(Boolean).join(' ');
      if (!includesIgnoreCase(topicHaystack, filters.topic)) return false;
    }

    if (filters.source) {
      const sourceHaystack = [
        item.source,
        item.source_name,
      ].filter(Boolean).join(' ');
      if (!includesIgnoreCase(sourceHaystack, filters.source)) return false;
    }

    if (filters.bias && filters.bias !== 'all') {
      if (!includesIgnoreCase(item.bias || item.political_bias, filters.bias)) return false;
    }

    if (filters.contentType && filters.contentType !== 'all') {
      const type = String(item.type || item.content_type || '').toLowerCase();
      if (type !== String(filters.contentType).toLowerCase()) return false;
    }

    if (timeframeMs) {
      const publishedAt = item.published_at || item.publication_date || item.created_at || item.date_created;
      if (!publishedAt) return false;
      const publishedMs = new Date(publishedAt).getTime();
      if (Number.isNaN(publishedMs)) return false;
      if ((now - publishedMs) > timeframeMs) return false;
    }

    return true;
  });
}

export function formatTimeAgo(isoDate) {
  if (!isoDate) return 'Unknown time';
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return 'Unknown time';
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export { timeframeToMs };
