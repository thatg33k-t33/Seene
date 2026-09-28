import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text().slice(0,300)}`); });
page.on('pageerror', e => errors.push(`[pageerror] ${String(e).slice(0,300)}`));
for (const url of ['http://localhost:3000/', 'http://localhost:3000/seene?seene-preview=1']) {
  errors.length = 0;
  try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); await page.waitForTimeout(6000); } catch (e) { errors.push('[goto] ' + String(e).slice(0,200)); }
  console.log('=== ' + url + ' ===');
  console.log('title:', await page.title());
  console.log('bodychars:', (await page.locator('body').innerText().catch(()=>'' )).slice(0,200).replace(/\n/g,' | '));
  console.log('html-in-div:', await page.evaluate(() => document.querySelectorAll('div html').length));
  console.log('frames:', page.frames().length);
  console.log('errors:', JSON.stringify(errors.slice(0,8), null, 1));
}
await browser.close();
