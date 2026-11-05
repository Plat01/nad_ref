import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { runChecks } from './browser-checks.mjs';

// Use the installed Chrome; browser binaries are not downloaded by npm install.
const server = await preview({ logLevel: 'error', preview: { host:'127.0.0.1', port:0, strictPort:true } });
let browser;
try {
  const address = server.httpServer.address();
  const baseURL = `http://127.0.0.1:${address.port}/nad_ref/`;
  browser = await chromium.launch({ channel:'chrome', headless:true });
  const context = await browser.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 });
  const page = await context.newPage();
  const report = await runChecks(page,{baseURL,root:process.cwd()});
  console.log(JSON.stringify({result:report.result,checks:report.checks,viewports:report.viewports.map(({width,height,overflow,dialogOverflow})=>({width,height,overflow,dialogOverflow})),errors:report.errors,report:'docs/research/verification.json'},null,2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
