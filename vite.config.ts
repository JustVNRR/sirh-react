import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

function resolveChunkName(id: string): string | undefined {
  if (id.includes('node_modules')) {
    if (
      id.includes('react-router-dom') ||
      id.includes(`${path.sep}react-dom${path.sep}`) ||
      id.includes(`${path.sep}react${path.sep}`)
    ) {
      return 'vendor-react';
    }
    if (id.includes('@tanstack')) {
      return 'vendor-tanstack';
    }
    if (id.includes('@radix-ui')) {
      return 'vendor-radix';
    }
    if (
      id.includes('react-hook-form') ||
      id.includes('@hookform') ||
      id.includes(`${path.sep}zod${path.sep}`)
    ) {
      return 'vendor-forms';
    }
    if (id.includes('lucide-react') || id.includes('sonner')) {
      return 'vendor-icons';
    }
    return undefined;
  }

  const normalized = id.split(path.sep).join('/');
  const featureMatch = /\/src\/features\/([^/]+)\//.exec(normalized);
  if (featureMatch?.[1]) {
    return `feature-${featureMatch[1]}`;
  }

  return undefined;
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: resolveChunkName,
      },
    },
  },
});
