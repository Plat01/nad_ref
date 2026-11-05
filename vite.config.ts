import { defineConfig } from 'vite';
import { renderPage } from './src/render.ts';

export default defineConfig({
  base: '/nad_ref/',
  plugins: [{
    name: 'nadezhdik-static-content',
    transformIndexHtml(html) {
      return html.replace('<div id="app"></div>', `<div id="app">${renderPage()}</div>`);
    },
  }],
});
