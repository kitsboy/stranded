import type { Config } from 'tailwindcss';

// Standalone Tailwind config for the static Marketing-Hub.html page.
// Scans ONLY that file and emits a self-contained CSS so the page no longer
// depends on the runtime Tailwind Play CDN (which caused a flash of unstyled
// content on every fresh load). Build: `npx tailwindcss -c tailwind.marketing.config.ts -i styles/marketing-input.css -o public/marketing-hub.css --minify`
const config: Config = {
  content: ['./public/Marketing-Hub.html'],
  theme: {
    extend: {
      colors: {
        midnight: '#1e293b',
        orange: '#FF8C00',
        teal: '#5BC0BE',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // keep the page's own <style> base rules
  },
};

export default config;
