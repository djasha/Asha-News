const DEFAULT_WORLDMONITOR_URL = 'https://worldmonitor.app';

export const WORLDMONITOR_URL = process.env.REACT_APP_WORLDMONITOR_URL || DEFAULT_WORLDMONITOR_URL;

export function buildWorldMonitorUrl(search = '') {
  try {
    const url = new URL(WORLDMONITOR_URL);
    const params = new URLSearchParams(search || '');
    params.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  } catch {
    return WORLDMONITOR_URL;
  }
}
