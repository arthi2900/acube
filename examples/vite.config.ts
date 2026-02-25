import {
  locationRoutePlugin,
  borderStylePlugin,
  fontsCodePlugin,
  mdClickPlugin,
  dynamicRedirectPlugin,
} from "miaoda-sc-plugin";

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    locationRoutePlugin(),
    borderStylePlugin(),
    fontsCodePlugin(),
    mdClickPlugin(),
    dynamicRedirectPlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    watch: {
      ignored: ['**/{node_modules,.git,dist,logs,temp}/**'],
      usePolling: true,
      interval: 300,
    },
    port: 3000,
    open: false,
  }
});