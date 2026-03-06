import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function resolveVendorChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;

  if (id.includes('/react-dom/') || id.includes('/react/')) return 'react';

  if (id.includes('/maplibre-gl/')) return 'maplibre';
  if (id.includes('/react-map-gl/')) return 'react-map-gl';

  if (id.includes('/@deck.gl/react/')) return 'deck-react';
  if (id.includes('/@deck.gl/layers/')) return 'deck-layers';
  if (id.includes('/@deck.gl/core/')) return 'deck-core';
  if (id.includes('/@deck.gl/extensions/')) return 'deck-extensions';
  if (id.includes('/@loaders.gl/')) return 'loaders-gl';
  if (id.includes('/@math.gl/')) return 'math-gl';
  if (id.includes('/@luma.gl/')) return 'luma-gl';
  if (id.includes('/@probe.gl/')) return 'probe-gl';
  if (id.includes('/mjolnir.js/')) return 'mjolnir';

  if (id.includes('/lucide-react/')) return 'lucide';

  return undefined;
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 4175,
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          return resolveVendorChunk(id);
        },
      },
    },
  },
});
