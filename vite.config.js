import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuracion minima de Vite para React + JavaScript.
export default defineConfig({
  plugins: [react()],
  server: { open: true },
});
