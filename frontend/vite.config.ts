import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import checker from 'vite-plugin-checker';
import { fileURLToPath } from 'url';
import path from 'path';

// Resolve __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Base path for Cloudflare Pages (empty for root, '/subpath/' if needed)
    base: '/',
    
    plugins: [
      react(),
      checker({
        typescript: true,
        eslint: {
          lintCommand: 'eslint "./src/**/*.{ts,tsx,js,jsx}"',
          dev: {
            logLevel: ['error'],
          },
        },
        overlay: {
          position: 'tl',
          initialIsOpen: false,
        },
      }),
    ],
    
    resolve: {
      alias: {
        src: path.resolve(__dirname, 'src'),
        '~': path.resolve(__dirname, 'node_modules'),
      },
    },
    
    // Server config (for local development only)
    server: {
      port: Number(env.VITE_PORT) || 3030,
      host: env.VITE_HOST || 'localhost',
    },
    
    // Preview config (for local preview of production build)
    preview: {
      port: Number(env.VITE_PORT) || 3030,
      host: env.VITE_HOST || 'localhost',
    },
    
    // Build-specific settings
    build: {
      outDir: 'dist', // Explicit output directory
      emptyOutDir: true, // Clear the directory before building
      sourcemap: mode !== 'production', // Disable sourcemaps in production
      chunkSizeWarningLimit: 1600, // Adjust chunk size warning
    },
    
    // Optimize for Cloudflare
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
  };
});
