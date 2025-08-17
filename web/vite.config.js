import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodePackageImporter } from "sass";
import fs from "fs";
import YAML from "yaml";
import pkg from '../package.json' with { type: 'json' };

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
    react()
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
    commonjsOptions: {
      defaultIsModuleExports: true, // Fix for Vite 4.0.3+ CommonJS handling changes
    },
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
          // Bundle React ecosystem together - ensures loading order and fixes Highcharts dependency issues
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/highcharts') ||
              id.includes('highcharts-react-official') ||
              id.includes('@dr.pogodin/react-helmet')) {
            return 'react-ecosystem';
          }
          
          // Group React Router separately (frequently changing)
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run')) {
            return 'routing';
          }
          
          // Group UI/CSS libraries
          if (id.includes('node_modules/@fortawesome') ||
              id.includes('node_modules/bulma') ||
              id.includes('node_modules/@creativebulma')) {
            return 'ui-libs';
          }
          
          // Group terminal and specialized libraries
          if (id.includes('node_modules/@xterm') ||
              id.includes('node_modules/@xyflow') ||
              id.includes('node_modules/elkjs') ||
              id.includes('node_modules/dagre')) {
            return 'specialized-libs';
          }
          
          // Group utility libraries
          if (id.includes('node_modules/axios') ||
              id.includes('node_modules/jwt-decode') ||
              id.includes('node_modules/re-resizable') ||
              id.includes('node_modules/react-resizable')) {
            return 'utilities';
          }
          
          // All remaining node_modules go to vendor (should be much smaller now)
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
