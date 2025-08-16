import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';
import { NodePackageImporter } from "sass";
import fs from "fs";
import YAML from "yaml";
import pkg from '../package.json';

// Load configuration from YAML file
// For vite.config.js, we need to handle the config path manually since we're in web/ directory
function loadViteConfig() {
  // Check environment variable first (set by systemd)
  if (process.env.CONFIG_PATH) {
    return YAML.parse(fs.readFileSync(process.env.CONFIG_PATH, 'utf8'));
  }
  
  // Fallback to local config for development
  const localConfigPath = '../config.yaml';
  if (fs.existsSync(localConfigPath)) {
    return YAML.parse(fs.readFileSync(localConfigPath, 'utf8'));
  }
  
  // Final fallback: return default configuration for build
  return {
    frontend: {
      port: 3000,
    },
    server: {
      hostname: 'localhost',
      port: 3443,
    }
  };
}

const config = loadViteConfig();

export default defineConfig({
  define: {
    // Define global constants that get replaced at build time from root package.json
    '__APP_VERSION__': JSON.stringify(pkg.version),
    '__APP_NAME__': JSON.stringify(pkg.name),
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern",
        importers: [new NodePackageImporter()],
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'images/*.png', 'images/*.svg'],
      manifest: {
        name: 'Zoneweaver',
        short_name: 'Zoneweaver',
        description: 'Server and Zone Management System',
        theme_color: '#ffffff',
        start_url: '/ui/',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [
          {
            src: 'images/logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'images/logo512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'local-api-cache',
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ],
  base: '/ui/',
  publicDir: "public",
  server: {
    port: config.frontend?.port || 3000,
    host: "0.0.0.0",
    https: false, // Disable HTTPS for dev server during build
    hmr: {
      port: config.frontend?.port || 3000,
      host: config.server?.hostname || 'localhost',
    },
    proxy: {
      "/api": {
        target: `http://${config.server?.hostname || 'localhost'}:${config.server?.port || 3443}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: false, // Disable source maps for production to avoid source map errors
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB for complex applications
    rollupOptions: {
      external: ["rollup"],
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: (assetInfo) => {
          // Keep favicons at root level
          if (assetInfo.name === 'favicon.ico' || assetInfo.name === 'dark-favicon.ico') {
            return '[name][extname]';
          }
          return `assets/[name].[ext]`;
        },
        manualChunks: (id) => {
          // Only split out the largest, most independent libraries
          // Keep React ecosystem together with charts to avoid dependency issues
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run') ||
              id.includes('node_modules/highcharts') ||
              id.includes('highcharts-react-official')) {
            return 'vendor';
          }
          
          // Only split out completely independent libraries
          if (id.includes('node_modules/@fortawesome')) {
            return 'fontawesome';
          }
          
          if (id.includes('node_modules/bulma') ||
              id.includes('node_modules/@creativebulma')) {
            return 'bulma';
          }
          
          // All other node_modules go to vendor
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
  },
  optimizeDeps: {
    exclude: ["rollup"]
  },
});
