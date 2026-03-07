import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const BUILD_ID = Date.now().toString(); // Generate a unique build ID
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__APP_BUILD_ID__': JSON.stringify(BUILD_ID) // Expose build ID globally
      },
      build: {
        rollupOptions: {
          output: {
            entryFileNames: `assets/[name].${BUILD_ID}.js`,
            chunkFileNames: `assets/[name].${BUILD_ID}.js`,
            assetFileNames: `assets/[name].${BUILD_ID}.[ext]`,
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
