import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/react-dom/') || id.includes('/react/')) return 'react';
          if (id.includes('/maplibre-gl/')) return 'maplibre';
          if (id.includes('/react-map-gl/')) return 'react-map-gl';
          if (id.includes('/@deck.gl/react/')) return 'deck-react';
          if (id.includes('/@deck.gl/layers/')) return 'deck-layers';
          if (id.includes('/@deck.gl/')) return 'deck-core';
          return undefined;
        },
      },
    },
  },
});
