// Run with an existing Playwright installation: node tests/student_edition_test.cjs
// Optional: GAME_URL=https://... ART_SHOTS=/path/to/screenshots ART_ONLY=1
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const target = process.env.GAME_URL || pathToFileURL(path.resolve(__dirname, '../index.html')).href;
const shots = process.env.ART_SHOTS;
if (shots) fs.mkdirSync(shots, {recursive:true});
const click = (page, selector) => page.locator(selector).first().click();
const cardClick = (page, selector) => page.locator(selector).first().evaluate(el => el.click());
const phase = page => page.evaluate(() => S.phase);
const results = [];
let browser;

async function open(options={}) {
  const ctx = await browser.newContext({viewport:{width:390,height:844}, reducedMotion:'reduce', hasTouch:true, ...options});
  // Stable sample games; these are flow checks, not a balance simulation.
  await ctx.addInitScript(() => { let seed=173; Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296); });
  const page = await ctx.newPage(), errors=[];
  page.setDefaultTimeout(10000);
  page.on('pageerror', e => errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**', r => r.abort());
  await page.goto(target);
  await page.waitForFunction(() => typeof S !== 'undefined' && S?.phase === 'title');
  return {ctx,page,errors};
}

async function imageChecks(page) {
  const art = await page.evaluate(() => ({
    loaded:ART_FILES().filter(f=>ART.ok[f]).length,
    expected:ART_FILES().length,
    portraits:CIT.flatMap(c=>[-2,0,2].map(m=>({id:c.id,m,painted:face(c.id,m).includes(`${c.id}-expressions.webp`)}))),
    island:!!document.querySelector('.hero-isle > img[src$="island-painted.webp"]'),
    heroPortraits:document.querySelectorAll('.hero-faces image[href$="-expressions.webp"]').length,
    scenes:Object.keys(SCENE).map(k=>({key:k,painted:landscape(k).includes('island-painted.webp')}))
  }));
  assert.equal(art.loaded, art.expected, 'all 13 art files load');
  assert(art.island, 'title uses painted island');
  assert(art.portraits.every(x=>x.painted), 'all 11 characters and 33 expressions use painted art');
  assert.equal(art.heroPortraits,11,'title contains 11 painted portraits');
  assert(art.scenes.every(x=>x.painted),'news, referendum and demographics all use painted island');
}

async function layoutChecks() {
  for (const [width,scheme] of [[360,'light'],[390,'light'],[1280,'light'],[390,'dark']]) {
    const {ctx,page,errors}=await open({viewport:{width,height:844},colorScheme:scheme});
    await imageChecks(page);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px ${scheme}: no page overflow`);
    assert.match(await page.title(),/誰來照顧誰/);
    if(shots) await page.screenshot({path:path.join(shots,`title-${width}-${scheme}.png`),fullPage:true});
    assert.deepEqual(errors,[]);
    await ctx.close();
    results.push({layout:width,scheme,passed:true});
  }
}

async function startGame(page,party) {
  await click(page,'[data-a=totitle]');
  await page.evaluate(p=>goCar(document.getElementById('scar'),PK.indexOf(p),false),party);
  await page.waitForFunction(p=>S.choice===p,party);
  await click(page,'[data-a=start]');
}

async function fullGame(party) {
  const {ctx,page,errors}=await open();
  await startGame(page,party);
  const seen=[], screenshotPhases=new Set();
  for(let guard=0;guard<80 && await phase(page)!=='final';guard++) {
    const ph=await phase(page);seen.push(ph);
    if(shots&&party==='sd'&&!screenshotPhases.has(ph)) {
      await page.screenshot({path:path.join(shots,`game-${ph}-390.png`),fullPage:true});screenshotPhases.add(ph);
    }
    if(ph==='news') {
      if(await page.locator('#spinbtn').count()) {await click(page,'#spinbtn');await page.waitForFunction(()=>S.event!==null);}
      if(await page.locator('[data-a=cq]').count()) await cardClick(page,'[data-a=cq]');
      assert.equal(await page.locator('.cits image[href$="-expressions.webp"]').count(),11,'news portraits are painted');
      await click(page,'[data-a=tobudget]');
    } else if(ph==='ref') {
      if(await page.locator('[data-a=refvote]').count()) {
        await click(page,'[data-a=stance][data-v=yes]');await click(page,'[data-a=spend][data-v="1"]');await click(page,'[data-a=refvote]');
        assert(await page.locator('image[href$="-expressions.webp"]').count()>0,'referendum uses painted portraits');
      }
      await click(page,'[data-a=refdone]');
    } else if(ph==='reform') {
      if(await page.locator('[data-a=rf][data-v=up]').count()) {await cardClick(page,'[data-a=rf][data-v=up]');await cardClick(page,'[data-a=reason]');}
      await click(page,'[data-a=reformdone]');
    } else if(ph==='demo') await click(page,'[data-a=demook]');
    else if(ph==='budget') {
      for(let i=0;i<3;i++) {
        const selector='.hc-act [data-a=pol]:not([disabled]):not([aria-pressed=true])';
        if(await page.locator(selector).count()) await cardClick(page,selector);
      }
      await cardClick(page,'.hc-act [data-a=det]');
      assert(await page.locator('#sheet').isVisible(),'detail opens');
      assert.match(await page.locator('#sheet').innerText(),/誰提供/,'policy metadata is integrated');
      if(shots&&party==='sd'&&!screenshotPhases.has('detail')) {
        await page.screenshot({path:path.join(shots,'game-detail-390.png')});screenshotPhases.add('detail');
      }
      await cardClick(page,'#sheet [data-a=shclose]');await cardClick(page,'[data-a=tray]');
      if(await page.locator('#sheet [data-a=rm]').count()) {
        const before=await page.evaluate(()=>S.platforms[0].add.length);
        await cardClick(page,'#sheet [data-a=rm]');
        assert.equal(await page.evaluate(()=>S.platforms[0].add.length),before-1,'remove policy');
      }
      await cardClick(page,'#sheet [data-a=shclose]');
      if(await page.evaluate(()=>S.platforms[0].add.length)===0) await cardClick(page,'.hc-act [data-a=pol]:not([disabled])');
      await click(page,'[data-a=count]');
    } else if(ph==='results') {
      await click(page,'[data-a=answer][data-i="0"]');
      for(let i=0;i<3;i++) {
        if(i===0&&await page.locator('[data-a=amend]').count()) await cardClick(page,'[data-a=amend]');
        await click(page,'[data-a=rnext]');
      }
      await click(page,'[data-a=confirm]');
    } else if(ph==='imf') await click(page,'[data-a=tofinal]');
    else throw new Error(`Unexpected phase ${ph}`);
  }
  const state=await page.evaluate(()=>({phase:S.phase,rounds:S.history.length,questions:S.qUsed,bankrupt:S.bankrupt}));
  assert.equal(state.phase,'final');assert.equal(state.rounds,5,`${party} completes five terms`);
  assert.equal(new Set(state.questions).size,state.questions.length,'no repeated questions');
  for(const ph of ['ref','reform','demo']) assert(seen.includes(ph),`${party}: ${ph} visited`);
  await page.locator('#refl0').fill('測試反思：照顧責任與政策取捨');
  assert.match(await page.evaluate(()=>summaryText()),/測試反思：照顧責任與政策取捨/);
  // Exercise clipboard failure: an editable copy fallback must contain the real reflection.
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('Test unavailable clipboard'))}}));
  await click(page,'[data-a=copy]');
  await page.waitForFunction(()=>!document.getElementById('copybox').hidden);
  assert.match(await page.locator('#copybox').inputValue(),/測試反思：照顧責任與政策取捨/);
  assert.deepEqual(errors,[]);
  if(shots&&party==='sd') await page.screenshot({path:path.join(shots,'game-final-390.png'),fullPage:true});
  results.push({party,...state,passed:true});
  console.log(JSON.stringify(results.at(-1)));await ctx.close();
}

async function bankruptcy() {
  const {ctx,page,errors}=await open();await startGame(page,'sd');
  await click(page,'#spinbtn');await page.waitForFunction(()=>S.event!==null);await click(page,'[data-a=tobudget]');
  await cardClick(page,'.hc-act [data-a=pol]:not([disabled])');await click(page,'[data-a=count]');
  await click(page,'[data-a=answer][data-i="0"]');for(let i=0;i<3;i++)await click(page,'[data-a=rnext]');
  await page.evaluate(()=>{S.debt=60});await click(page,'[data-a=confirm]');assert.equal(await phase(page),'imf');
  assert(await page.locator('image[href$="-expressions.webp"]').count()>0,'bankruptcy uses painted portraits');
  await click(page,'[data-a=tofinal]');assert.equal(await phase(page),'final');assert.equal(await page.evaluate(()=>S.bankrupt),true);
  assert.deepEqual(errors,[]);await ctx.close();results.push({bankruptcy:true,passed:true});
}

async function fallback() {
  const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/assets/**',r=>r.abort());await page.route('https://fonts.googleapis.com/**',r=>r.abort());
  await page.goto(target);await page.waitForFunction(()=>typeof S!=='undefined'&&S?.phase==='title');
  assert.equal(await page.locator('.poster>svg').count(),1,'offline fallback is visible');
  assert.equal(await page.locator('.poster image').count(),0,'no broken portrait images');
  await startGame(page,'sd');assert.equal(await phase(page),'news');assert.deepEqual(errors,[]);
  await ctx.close();results.push({missingAssetsFallback:true,passed:true});
}

(async()=>{
  browser=await chromium.launch();await layoutChecks();
  if(!process.env.ART_ONLY){for(const party of ['sd','nr','tw','mx','fe','ns','gr'])await fullGame(party);await bankruptcy();}
  await fallback();console.log(JSON.stringify({target,results},null,2));
  if(shots)fs.writeFileSync(path.join(shots,'test-results.json'),JSON.stringify({target,results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
