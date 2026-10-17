// Use the existing Playwright runtime. Optional GAME_URL and ART_SHOTS.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const target=process.env.GAME_URL||pathToFileURL(path.resolve(__dirname,'../index.html')).href;
const shots=process.env.ART_SHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
let browser;const results=[];
async function open(width=390,scheme='light',motion='reduce',blockArt=false){
 const ctx=await browser.newContext({viewport:{width,height:950},colorScheme:scheme,reducedMotion:motion});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 if(blockArt)await page.route('**/events-painted-v1.webp',r=>r.abort());
 await page.goto(target);await page.waitForFunction(()=>typeof S!=='undefined'&&S?.phase==='title');
 await page.locator('[data-a=totitle]').click();await page.locator('[data-a=start]').click();return {ctx,page,errors};
}
async function shot(page,name){if(shots)await page.locator('.wheel-prop').screenshot({path:path.join(shots,name+'.png'),style:'.actionbar,.hud{visibility:hidden}'});}
(async()=>{
 browser=await chromium.launch();
 const normal=await open(390,'light','no-preference');
 // A local control should let touch/keyboard players start without leaving the prop.
 assert.equal(await normal.page.getByRole('button',{name:'揭曉本屆新聞',exact:true}).count(),1,'a labelled draw control is available at the prop');
 await normal.page.getByRole('button',{name:'揭曉本屆新聞',exact:true}).click();
 assert.equal(await normal.page.locator('[data-a=spin]:not(:disabled)').count(),0,'both controls disabled during draw');
 await normal.page.waitForFunction(()=>!!document.querySelector('.wheel-segment.is-selected'));
 const selected=await normal.page.evaluate(()=>{const el=document.querySelector('.wheel-segment.is-selected'),id=el.dataset.event,i=EVENTS.findIndex(e=>e.id===id);return {id,short:EVENTS[i].short,angle:((S.rot+(i+.5)*360/EVENTS.length)%360+360)%360,readout:document.querySelector('.wheel-result').textContent,event:S.event};});
 assert(selected.angle<.01||selected.angle>359.99,'pointer lands on the chosen segment');
 assert.equal(selected.readout,selected.short,'upright readout identifies the selection');
 assert.equal(selected.event,null,'selected segment is visible before the news replaces the prop');
 await normal.page.waitForFunction(()=>S.event!==null);
 assert.equal(await normal.page.evaluate(()=>S.event),selected.id,'news matches the pointer');
 assert.deepEqual(normal.errors,[]);await normal.ctx.close();results.push({animatedDrawAndPointer:true,passed:true});
 for(const [width,scheme] of [[360,'light'],[390,'light'],[768,'light'],[1280,'light'],[390,'dark']]){
  const {ctx,page,errors}=await open(width,scheme);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal scrolling');
  assert.equal(await page.locator('.wheel-segment').count(),8);
  assert.equal(await page.locator('.wheel-art').count(),8,'eight painted event symbols');
  assert.equal(await page.locator('#wheelg').evaluate(e=>getComputedStyle(e).transitionDuration),'0s','reduced motion respected');
  await shot(page,`wheel-${width}-${scheme}`);
  const seen=[];
  for(let n=0;n<8;n++){
   assert.equal(await page.locator('.wheel-segment.is-used').count(),n,'already broadcast events are marked');
   await page.getByRole('button',{name:'揭曉本屆新聞',exact:true}).click();
   const id=await page.evaluate(()=>S.event);assert(id);assert(!seen.includes(id),'draws never repeat');seen.push(id);
   assert.equal(await page.locator('.broadcast-screen-title').innerText(),await page.evaluate(()=>ev().short));
   if(n<7){await page.evaluate(()=>{S.event=null;render()});if(n===2)await shot(page,`wheel-used-${width}-${scheme}`);}
  }
  assert.deepEqual(errors,[]);await ctx.close();results.push({width,scheme,eightUniqueDraws:true,passed:true});
 }
 const fallback=await open(390,'light','reduce',true);
 assert.equal(await fallback.page.locator('.wheel-art').count(),0,'no broken illustration when art is unavailable');
 assert.equal(await fallback.page.locator('.wheel-label').count(),8,'all event names remain readable');
 await fallback.page.getByRole('button',{name:'揭曉本屆新聞',exact:true}).click();
 await fallback.page.locator('[data-a=tobudget]').click();assert.equal(await fallback.page.evaluate(()=>S.phase),'budget');
 assert.deepEqual(fallback.errors,[]);await fallback.ctx.close();results.push({artFailureStillPlayable:true,passed:true});
 console.log(JSON.stringify({target,results},null,2));if(shots)fs.writeFileSync(path.join(shots,'wheel-results.json'),JSON.stringify({target,results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close()});
