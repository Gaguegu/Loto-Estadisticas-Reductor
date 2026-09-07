import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: '/Loto-Estadisticas-Reductor/', // ⬅️ 1. ESTO IMPORTANTE: Define la ruta base para GitHub Pages
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          id: '/Loto-Estadisticas-Reductor/', // ⬅️ 2. Corregido para GitHub Pages
          name: 'LotoEstadísticas & Reductor',
          short_name: 'LotoReductor',
          description: 'Análisis estadístico y combinaciones reducidas para Lotería Primitiva, Bonoloto y Euromillones.',
          theme_color: '#1e3a8a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/Loto-Estadisticas-Reductor/', // ⬅️ 3. Corregido para GitHub Pages
          scope: '/Loto-Estadisticas-Reductor/', // ⬅️ 4. Corregido para GitHub Pages
          icons: [
            {
              src: 'icon.svg', // ⬅️ Quitamos la barra inicial para que sea una ruta relativa correcta
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
