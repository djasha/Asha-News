// Utility functions to sanitize and safely parse AI JSON responses

function stripCodeFences(text) {
  if (!text || typeof text !== 'string') return '';
  // Remove ```json ... ``` or ``` ... ``` fences
  return text.replace(/^```(?:json)?\s*\n?|```$/gmi, '').trim();
}

function extractJsonSubstring(text) {
  // Find first JSON object or array and try to extract it
  const startObj = text.indexOf('{');
  const startArr = text.indexOf('[');
  const start = (startObj === -1) ? startArr : (startArr === -1 ? startObj : Math.min(startObj, startArr));
  if (start === -1) return null;

  // Heuristic: find last closing brace/bracket
  const lastObj = text.lastIndexOf('}');
  const lastArr = text.lastIndexOf(']');
  const end = Math.max(lastObj, lastArr);
  if (end === -1 || end < start) return null;

  return text.slice(start, end + 1).trim();
}

function sanitizeJsonContent(text) {
  const stripped = stripCodeFences(text || '');
  const candidate = extractJsonSubstring(stripped) || stripped;
  return candidate.trim();
}

function tryParseJson(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    const sanitized = sanitizeJsonContent(text);
    try {
      return JSON.parse(sanitized);
    } catch (_) {
      return null;
    }
  }
}

module.exports = {
  stripCodeFences,
  extractJsonSubstring,
  sanitizeJsonContent,
  tryParseJson,
};
