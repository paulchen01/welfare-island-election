// Existing Playwright + Chromium required. Optional GAME_URL and ART_SHOTS.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const target=process.env.GAME_URL||pathToFileURL(path.resolve(__dirname,'../index.html')).href;
const shots=process.env.ART_SHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
let browser;
const results=[];
async function open(width,scheme='light',blockStudio=false){
 const ctx=await browser.newContext({viewport:{width,height:950},colorScheme:scheme,reducedMotion:'reduce'});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 if(blockStudio)await page.route('**/newsroom-painted-v1.webp',r=>r.abort());
 await page.goto(target);await page.waitForFunction(()=>typeof S!=='undefined'&&S?.phase==='title');
 await page.locator('[data-a=totitle]').click();await page.locator('[data-a=start]').click();
 return {ctx,page,errors};
}
async function checkLayout(page){
 const metrics=await page.evaluate(()=>{
  const box=document.querySelector('.broadcast'),headline=box?.querySelector('.broadcast-headline');
  return {overflow:document.documentElement.scrollWidth>innerWidth,headlineClipped:headline&&headline.scrollWidth>headline.clientWidth,studio:!!box?.querySelector('.broadcast-studio'),body:box?.innerText};
 });
 assert.equal(metrics.overflow,false,'page does not overflow');
 assert.equal(metrics.headlineClipped,false,'headline is not clipped');
 assert.match(metrics.body,/福利島新聞台/);assert.match(metrics.body,/國債/);
 assert.match(metrics.body,/阿蒂.*投票權/,'original civic message preserved');
 return metrics;
}
(async()=>{
 browser=await chromium.launch();
 for(const [width,scheme] of [[360,'light'],[390,'light'],[1280,'light'],[390,'dark']]){
  const {ctx,page,errors}=await open(width,scheme);
  assert.equal(await page.locator('.broadcast').count(),1,'news page has a newsroom broadcast');
  assert.equal((await checkLayout(page)).studio,true,'painted anchor and studio visible');
  assert(await page.locator('.broadcast-headline').innerText().then(t=>t.includes('今日焦點')));
  if(shots)await page.locator('.broadcast').screenshot({path:path.join(shots,`studio-waiting-${width}-${scheme}.png`),style:'#bar,.hud{visibility:hidden}'});
  await page.locator('#spinbtn').click();await page.waitForFunction(()=>S.event!==null);
  const event=await page.evaluate(()=>ev());
  assert.equal(await page.locator('.broadcast-headline').innerText(),event.name,'headline follows drawn event');
  assert.equal(await page.locator('.broadcast-screen-title').innerText(),event.short,'studio screen follows drawn event');
  assert.match(await page.locator('.broadcast').innerText(),new RegExp(event.d.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.equal(await page.locator('.broadcast-studio').evaluate(i=>i.complete&&i.naturalWidth>0),true);
  await checkLayout(page);
  if(shots)await page.locator('.broadcast').screenshot({path:path.join(shots,`studio-event-${width}-${scheme}.png`),style:'#bar,.hud{visibility:hidden}'});
  assert.equal(await page.locator('.broadcast-live i').evaluate(el=>getComputedStyle(el).animationName),'none','reduced motion');
  assert.deepEqual(errors,[]);await ctx.close();results.push({width,scheme,passed:true});
 }
 const {ctx,page,errors}=await open(390);
 const events=await page.evaluate(()=>EVENTS.map(e=>({id:e.id,name:e.name,short:e.short,fxt:e.fxt})));
 for(const event of events){
  await page.evaluate(id=>{S.event=id;render()},event.id);
  assert.equal(await page.locator('.broadcast-headline').innerText(),event.name);
  assert.equal(await page.locator('.broadcast-screen-title').innerText(),event.short);
  for(const fact of event.fxt)assert((await page.locator('.broadcast').innerText()).includes(fact));
  await checkLayout(page);
 }
 assert.deepEqual(errors,[]);await ctx.close();results.push({allEightEvents:true,passed:true});
 const fallback=await open(390,'light',true);
 assert.equal(await fallback.page.locator('.broadcast-stage.is-fallback').count(),1);
 assert.equal(await fallback.page.locator('.broadcast-studio').count(),0,'no broken studio image');
 await checkLayout(fallback.page);await fallback.page.locator('#spinbtn').click();await fallback.page.waitForFunction(()=>S.event!==null);
 await fallback.page.locator('[data-a=tobudget]').click();assert.equal(await fallback.page.evaluate(()=>S.phase),'budget');
 assert.deepEqual(fallback.errors,[]);await fallback.ctx.close();results.push({studioFailureStillPlayable:true,passed:true});
 console.log(JSON.stringify({target,results},null,2));
 if(shots)fs.writeFileSync(path.join(shots,'newsroom-results.json'),JSON.stringify({target,results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close()});
