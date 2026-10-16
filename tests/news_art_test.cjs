const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const root=path.join(__dirname,'..'),url=pathToFileURL(path.join(root,'index.html')).href;
const shots=process.env.NEWS_SHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:process.env.ART_BROWSER_CHANNEL||'msedge',headless:true});try{
const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto(url);
assert.equal(await page.locator('.painted-face').count(),11,'homepage uses all 11 painted portraits');
await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));
if(shots)await page.screenshot({path:path.join(shots,'home-390.png')});
await page.locator('[data-a=totitle]').click();await page.locator('[data-a=choose][data-k=ds]').click();await page.locator('[data-a=start]').click();
assert.equal(await page.locator('.broadcast-status').textContent(),'待播');
for(const id of ['e1','e2','e3','e4','e5','e6','e7','e8']){
await page.evaluate(id=>{S.event=null;S.used=EVENTS.filter(e=>e.id!==id).map(e=>e.id);render()},id);
await page.locator('#spinbtn').click();await page.waitForFunction(id=>S.event===id,id);
assert.equal(await page.locator('.news-scene').getAttribute('data-event'),id);
assert((await page.locator('.news-image').getAttribute('src')).endsWith('/'+id+'.webp'));
const actual=await page.evaluate(()=>({name:ev().name,fx:ev().fxt}));
assert.equal(await page.locator('.bulletin .headline').textContent(),actual.name);
assert.deepEqual(await page.locator('.bulletin .fx .chip').allTextContents(),actual.fx);
await page.waitForFunction(()=>document.querySelector('.news-image').complete&&document.querySelector('.news-image').naturalWidth>0);
assert.equal(await page.locator('.news-scene.is-closeup').count(),1);
await page.locator('[data-news-view=wide]').click();assert.equal(await page.locator('.news-scene.is-closeup').count(),0);
assert.equal(await page.locator('[data-news-view=wide]').getAttribute('aria-pressed'),'true');
await page.locator('[data-news-view=close]').click();assert.equal(await page.locator('.news-scene.is-closeup').count(),1);
if(shots)await page.locator('.bulletin').screenshot({path:path.join(shots,id+'-390.png')});
assert.equal(await page.locator('.ava svg').count(),0);
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
}
await page.evaluate(()=>{S.event=null;S.used=[];render()});
for(let i=0;i<5;i++){await page.locator('#spinbtn').click();await page.evaluate(()=>{S.event=null;render()});}
assert.equal(await page.evaluate(()=>new Set(S.used).size),5,'no repeated event');
for(const scheme of ['light','dark'])for(const width of [360,390,1280]){
await page.emulateMedia({colorScheme:scheme,reducedMotion:'reduce'});await page.setViewportSize({width,height:900});
await page.evaluate(()=>{S.event='e5';render()});
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
const small=await page.locator('[data-news-view]').evaluateAll(es=>es.some(e=>e.getBoundingClientRect().height<44));assert.equal(small,false);
assert.equal(await page.locator('.news-scene').evaluate(e=>getComputedStyle(e).animationName),'none');
if(shots&&width===390)await page.locator('.bulletin').screenshot({path:path.join(shots,scheme+'-storm.png')});
}
await page.evaluate(()=>{document.querySelector('.news-image').src='assets/scenes/news/intentionally-missing.webp'});
await page.locator('.news-image-error').waitFor({state:'visible'});assert(await page.locator('[data-a=tobudget]').isEnabled());
// Real animation path: re-entry must not select two events; image and headline settle together.
await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:390,height:844});
await page.evaluate(()=>{S.event=null;S.used=[];render()});await page.locator('#spinbtn').click();
assert.equal(await page.locator('.broadcast-status').textContent(),'連線中');
await page.evaluate(()=>spin());await page.waitForFunction(()=>S.event!==null);
assert.equal(await page.evaluate(()=>S.used.length),1);
assert.equal(await page.locator('.news-scene').getAttribute('data-event'),await page.evaluate(()=>S.event));
assert.deepEqual(errors,[]);
// Artifact must carry its own raster assets: external image requests are blocked.
const artifact=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
await artifact.route('**/*',route=>route.request().resourceType()==='image'&&!route.request().url().startsWith('data:')?route.abort():route.continue());
await artifact.goto(pathToFileURL(path.join(root,'artifact/welfare-island.html')).href);
await artifact.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));
assert((await artifact.locator('.news-image').getAttribute('src')).startsWith('data:image/webp;base64,'));
assert.equal(await artifact.locator('.news-image-error').isVisible(),false,'healthy Artifact must not show image failure overlay');
await artifact.evaluate(()=>{S.choice='ds';S.assign=['ds','nr','co','tw','fe','gr'];S.phase='news';S.event='e3';render()});
await artifact.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));
assert.equal(await artifact.locator('.news-image-error').isVisible(),false);
console.log('PASS: 8 wheel/event images and headlines/effects; camera switch; no repeats; double-spin guard; 11 raster portraits; light/dark 360/390/1280; reduced motion; image failure; self-contained Artifact.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
