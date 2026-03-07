import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import type { Plugin } from 'vite';

// Cross-origin isolation headers required by @huggingface/transformers.
// SharedArrayBuffer (used by the ONNX WebAssembly backend) is only available in
// "cross-origin isolated" contexts. IMPORTANT: these must be applied to every
// response (including @fs worker script URLs), not just the HTML entry point.
function crossOriginIsolationPlugin(): Plugin {
  return {
    name: 'cross-origin-isolation',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), crossOriginIsolationPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
  optimizeDeps: {
    exclude: ['@huggingface/transformers'],
  },
  // Emit the worker as a separate ES module chunk
  worker: {
    format: 'es',
  },
  server: {
    // Allow Vite to serve files from the library source root (../src)
    // so the worker file at ../src/workers/inference.worker.ts can be loaded.
    fs: {
      allow: ['..'],
    },
  },
});
