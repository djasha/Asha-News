export function isCodWarPreviewEnabled() {
  if (process.env.NODE_ENV === 'test') return false;
  if (typeof window === 'undefined') return false;
  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (!isLocalHost) return false;

  const params = new URLSearchParams(window.location.search);
  // Local default is enabled so UI can be validated even if flag rows are missing.
  return params.get('preview') !== '0';
}
