// Generate OPML from scripts/sources.json grouped by category
// Usage: node scripts/generate_opml.js > asha-sources.opml
const fs = require('fs');
const path = require('path');

const SOURCES_PATH = path.join(__dirname, 'sources.json');

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function main() {
  const raw = fs.readFileSync(SOURCES_PATH, 'utf8');
  const sources = JSON.parse(raw);
  const byCat = new Map();
  for (const s of sources) {
    const cat = (s.category || 'general').toLowerCase();
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(s);
  }

  const date = new Date().toISOString();
  let out = '';
  out += '<?xml version="1.0" encoding="UTF-8"?>\n';
  out += '<opml version="1.1">\n';
  out += '  <head>\n';
  out += `    <title>Asha.News Sources</title>\n`;
  out += `    <dateCreated>${esc(date)}</dateCreated>\n`;
  out += '  </head>\n';
  out += '  <body>\n';

  for (const [cat, list] of byCat.entries()) {
    out += `    <outline text="${esc(cat)}" title="${esc(cat)}">\n`;
    for (const s of list) {
      out += `      <outline type="rss" text="${esc(s.name)}" title="${esc(s.name)}" xmlUrl="${esc(s.rss)}" />\n`;
    }
    out += '    </outline>\n';
  }

  out += '  </body>\n';
  out += '</opml>\n';
  process.stdout.write(out);
}

main();
