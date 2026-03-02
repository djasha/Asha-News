/**
 * Centralized API configuration.
 * All frontend files should import from here instead of hardcoding URLs.
 */

// Base server URL (no trailing slash, no /api suffix)
export const API_SERVER = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Base API URL (with /api suffix)
export const API_BASE = `${API_SERVER}/api`;
export const API_V1_BASE = `${API_BASE}/v1`;

// CMS API URL
export const CMS_BASE = `${API_SERVER}/api/cms`;
