import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

/** Run with a Playwright Page. Does not submit data or call an external service. */
export async function runChecks(page, options = {}) {
  const baseURL = options.baseURL || 'http://localhost:4174/';
  const root = options.root || '/home/dima/alex/crency_nad';
  const shots = `${root}/.impeccable/review`;
  await mkdir(shots, { recursive: true });
  const errors = [];
  const nonGetRequests = [];
  const failures = [];
  const cancelledResources = [];
  const onError = error => errors.push(error.message);
  const onConsole = msg => { if (msg.type() === 'error') errors.push(msg.text()); };
  const onRequest = request => { if (request.method() !== 'GET') nonGetRequests.push(`${request.method()} ${request.url()}`); };
  const onFailed = request => {
    // Chrome can cancel a favicon during the deliberate setup reload.
    if (request.failure()?.errorText === 'net::ERR_ABORTED') cancelledResources.push(request.url());
    else failures.push(request.url());
  };
  page.on('pageerror', onError); page.on('console', onConsole);
  page.on('request', onRequest); page.on('requestfailed', onFailed);
  const report = { checkedAt: new Date().toISOString(), baseURL, viewports: [], checks: [], screenshots: [], errors, nonGetRequests, failures, cancelledResources };
  const record = name => {
    report.checks.push({ name, result: 'pass' });
    console.log(`[qa] ${name}`);
  };
  const settle = (ms = 800) => page.waitForTimeout(ms);
  const screenshot = async name => {
    await page.screenshot({ path: `${shots}/${name}.png` });
    report.screenshots.push(`.impeccable/review/${name}.png`);
  };
  const scrollTo = async y => { await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y); await settle(); };
  const center = async selector => { await page.locator(selector).evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await settle(); };

  try {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(baseURL);
    await page.evaluate(() => localStorage.removeItem('nadezhdik-motion'));
    await page.reload();
    await page.waitForFunction(() => document.documentElement.classList.contains('has-motion'));
    assert.equal((await page.request.get(new URL('assets/favicon.svg',baseURL).href)).status(),200);
    await settle(2000);

    for (const [width, height] of [[1440,900], [768,1024], [390,844]]) {
      await page.setViewportSize({ width, height });
      await scrollTo(0);
      await screenshot(`${width}-hero`);
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        broken: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.src),
        title: document.querySelector('h1').textContent,
        sections: [...document.querySelectorAll('main>section,footer')].map(e => ({ id: e.id || e.className, top: Math.round(e.getBoundingClientRect().top + scrollY), height: Math.round(e.getBoundingClientRect().height) })),
      }));
      assert.equal(metrics.overflow, 0, `${width}: page overflow`);
      assert.deepEqual(metrics.broken, [], `${width}: missing images`);
      for (const section of metrics.sections) {
        await scrollTo(section.top + (section.id === 'about' ? (section.height - height) * .95 : 0));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, `${width}: overflow at ${section.id}`);
        await screenshot(`${width}-${section.id.replace(/[^a-z-]/g, '')}`);
      }
      await page.locator('.dock [data-open="request"]').click(); await settle(550);
      const dialogMetrics = await page.locator('#request-dialog').evaluate(e => ({
        width: e.clientWidth, scroll: e.scrollWidth,
        close: e.querySelector('.form-close').getBoundingClientRect().toJSON(),
      }));
      assert.ok(dialogMetrics.scroll <= dialogMetrics.width + 1, `${width}: dialog overflow`);
      assert.ok(dialogMetrics.close.right <= width, `${width}: close button is outside viewport`);
      await screenshot(`${width}-form`);
      await page.keyboard.press('Escape'); await settle(600);
      await page.locator('.dock [data-open="menu"]').click(); await settle(850);
      assert.equal(await page.locator('#menu-dialog').evaluate(e => e.open), true);
      await screenshot(`${width}-menu`);
      await page.keyboard.press('Escape'); await settle(600);
      report.viewports.push({ width, height, overflow: metrics.overflow, dialogOverflow: dialogMetrics.scroll - dialogMetrics.width, sections: metrics.sections });
    }
    record('1440 / 768 / 390: every section, menu and form fit the viewport');

    await page.setViewportSize({ width:1440, height:900 });
    await center('#directions');
    const visited = [];
    for (let i = 0; i < 6; i++) {
      await page.locator(`[data-deck-select="${i}"]`).click(); await settle(750);
      const selected = await page.locator('.direction-card.is-active').getAttribute('data-direction-card');
      assert.equal(selected, String(i)); visited.push(selected);
    }
    assert.equal(new Set(visited).size, 6);
    await page.locator('.deck').focus();
    await page.keyboard.press('Home'); await settle();
    assert.equal(await page.locator('.direction-card.is-active').getAttribute('data-direction-card'), '0');
    await page.keyboard.press('ArrowRight'); await settle();
    assert.equal(await page.locator('.direction-card.is-active').getAttribute('data-direction-card'), '1');
    await page.keyboard.press('End'); await settle();
    assert.equal(await page.locator('.direction-card.is-active').getAttribute('data-direction-card'), '5');
    record('All six desktop directions and keyboard navigation');

    await page.locator('.direction-card.is-active [data-open="request"]').click(); await settle(600);
    assert.equal(await page.locator('#contact-form select').inputValue(), 'chinese');
    await page.locator('.form-submit').click();
    assert.equal(await page.locator('#contact-form [aria-invalid="true"]').count(), 2);
    await page.locator('[name="parentName"]').fill('Тестовый родитель');
    await page.locator('[name="phone"]').fill('123');
    await page.locator('.form-submit').click();
    assert.equal(await page.locator('[name="phone"]').getAttribute('aria-invalid'), 'true');
    await page.locator('[name="phone"]').fill('+7 (999) 123-45-67');
    await page.locator('.form-submit').click();
    assert.match(await page.locator('#form-result').innerText(), /заявка не отправлена/);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.querySelector('#request-dialog').contains(document.activeElement)), true, 'Focus escaped the modal');
    }
    await screenshot('form-validated');
    await page.keyboard.press('Escape'); await settle(600);
    assert.equal(await page.locator('#request-dialog').evaluate(e => e.open), false);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.direction), 'chinese');
    assert.equal(await page.locator('[name="parentName"]').inputValue(), '');
    record('Form prefill, validation, focus containment, Escape, focus return and clearing');

    await page.locator('.dock [data-open="menu"]').click(); await settle(850);
    await page.locator('#menu-dialog nav [href="#family"]').click(); await settle(1900);
    assert.equal(await page.locator('#menu-dialog').evaluate(e => e.open), false);
    assert.equal(new URL(page.url()).hash, '#family');
    assert.ok(Math.abs(await page.locator('#family').evaluate(e => e.getBoundingClientRect().top)) < 4);
    record('Menu anchor closes the modal and reaches its section');

    await center('.mood-form');
    await page.locator('.mood-help .mood-disc').click();
    await center('.mood-submit');
    await page.locator('.mood-submit').click(); await settle(600);
    assert.match(await page.locator('[name="comment"]').inputValue(), /Нужна помощь/);
    await page.keyboard.press('Escape'); await settle(600);
    await center('.mood-form');
    await page.locator('.mood-explore .mood-disc').click();
    await center('.mood-submit');
    await page.locator('.mood-submit').click(); await settle(1500);
    assert.equal(await page.locator('#request-dialog').evaluate(e => e.open), false);
    assert.ok(Math.abs(await page.locator('#directions').evaluate(e => e.getBoundingClientRect().top)) < 4);
    record('Mood selection changes the next action and form context');

    await page.locator('[data-motion="reduced"]').click(); await settle(500);
    assert.equal(await page.locator('html').evaluate(e => e.classList.contains('reduced-motion')), true);
    assert.equal(await page.locator('.direction-card[aria-hidden="false"]').count(), 6);
    for (const [width,height] of [[1440,900],[768,1024],[390,844]]) {
      await page.setViewportSize({width,height});
      await center('#directions');
      await screenshot(`${width}-reduced-deck`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth),0);
      const clipping = await page.locator('.direction-back').evaluateAll(es => es.filter(e => e.scrollHeight > e.clientHeight + 2).map(e => e.querySelector('h3').textContent));
      assert.deepEqual(clipping, [], `${width}: static card content clipped`);
      const coverClipping = await page.locator('.direction-cover h3').evaluateAll(es => es.filter(e => {
        const heading=e.getBoundingClientRect(), cover=e.closest('.direction-cover').getBoundingClientRect();
        return heading.left<cover.left-1 || heading.right>cover.right+1 || e.scrollWidth>e.clientWidth+1;
      }).map(e=>e.textContent));
      assert.deepEqual(coverClipping, [], `${width}: static cover heading clipped`);
    }
    assert.equal(await page.evaluate(() => localStorage.getItem('nadezhdik-motion')), 'reduced');
    record('Reduced motion exposes all six complete cards at all three widths');

    const browser = page.context().browser();
    const noJS = await browser.newContext({ javaScriptEnabled:false, viewport:{width:390,height:844} });
    const staticPage = await noJS.newPage();
    await staticPage.goto(baseURL);
    assert.equal(await staticPage.locator('h1').count(),1);
    assert.equal(await staticPage.locator('.direction-card').count(),6);
    assert.equal(await staticPage.evaluate(() => document.documentElement.scrollWidth-innerWidth),0);
    await staticPage.screenshot({path:`${shots}/no-js-mobile.png`});
    await noJS.close(); record('No JavaScript: readable static page with six directions');

    const systemContext = await browser.newContext({ reducedMotion:'reduce', viewport:{width:390,height:844} });
    const systemPage = await systemContext.newPage();
    await systemPage.goto(baseURL);
    await systemPage.waitForFunction(() => document.documentElement.classList.contains('reduced-motion'));
    await systemPage.waitForFunction(() => document.querySelectorAll('.direction-card[aria-hidden="false"]').length === 6);
    assert.equal(await systemPage.locator('.direction-card[aria-hidden="false"]').count(),6);
    await systemContext.close(); record('System reduced-motion preference works on first visit');

    const touchContext = await browser.newContext({ viewport:{width:390,height:844}, hasTouch:true, isMobile:true, deviceScaleFactor:1 });
    const touchPage = await touchContext.newPage();
    await touchPage.goto(baseURL);
    await touchPage.waitForFunction(() => document.documentElement.classList.contains('has-motion'));
    await touchPage.evaluate(() => window.scrollTo({top:document.querySelector('#directions').getBoundingClientRect().top+scrollY,behavior:'instant'}));
    await touchPage.waitForTimeout(800);
    const before = await touchPage.evaluate(() => scrollY);
    const cdp = await touchContext.newCDPSession(touchPage);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:620}]});
    for(let i=1;i<=10;i++) {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:620-i*50}]});
      await touchPage.waitForTimeout(24);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await touchPage.waitForTimeout(1000);
    const after = await touchPage.evaluate(() => scrollY);
    assert.ok(after>before+150, 'Vertical touch scrolling is swallowed by the deck');
    const chapter = await touchPage.locator('.direction-card.is-active').getAttribute('data-direction-card');
    assert.notEqual(chapter,'0','Touch scrolling did not advance the flipbook');
    await touchPage.screenshot({path:`${shots}/touch-flipbook.png`});
    await touchPage.locator('.dock [data-open="request"]').tap(); await touchPage.waitForTimeout(600);
    assert.equal(await touchPage.locator('#request-dialog').evaluate(e=>e.open),true);
    await touchContext.close(); record('Chromium synthesized touch: vertical swipe flips cards and subsequent tap opens form');

    assert.deepEqual(errors,[],'Browser errors');
    assert.deepEqual(nonGetRequests,[],'A prototype must not send form data');
    assert.deepEqual(failures,[],'Failed resource requests');
    record('No browser errors, missing resources or non-GET requests');
    report.result='pass';
    return report;
  } catch (error) {
    report.result = 'fail';
    report.error = error.message;
    throw error;
  } finally {
    page.off('pageerror',onError);page.off('console',onConsole);page.off('request',onRequest);page.off('requestfailed',onFailed);
    await writeFile(`${root}/docs/research/verification.json`,JSON.stringify(report,null,2)+'\n');
  }
}
