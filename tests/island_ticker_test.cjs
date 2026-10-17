const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const target=process.env.GAME_URL||pathToFileURL(path.resolve(__dirname,'../index.html')).href;
const shots=process.env.ART_SHOTS;if(shots)fs.mkdirSync(shots,{recursive:true});
let browser;const results=[];
async function open(width=390,motion='reduce',scheme='light'){
 const ctx=await browser.newContext({viewport:{width,height:950},reducedMotion:motion,colorScheme:scheme});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto(target);
 await page.waitForFunction(()=>typeof S!=='undefined'&&S?.phase==='title');
 await page.locator('[data-a=totitle]').click();await page.locator('[data-a=start]').click();return {ctx,page,errors};
}
async function govern(page,add=[],cut=[]){await page.evaluate(({add,cut})=>{
 S.event='e1';S.platforms=blank();S.platforms[0].add=add;S.platforms[0].cut=cut;
 VOTES=votes();VOTES.pct=[100,0,0,0,0,0,0];confirmGov();
},{add,cut});}
(async()=>{
 browser=await chromium.launch();
 const {ctx,page,errors}=await open();
 await page.evaluate(()=>{S.enacted=[{id:'p5',cost:2,start:0}];});
 await govern(page,[],['p5']);
 assert.equal(await page.locator('.isle-bld').count(),1,'ending a service keeps its existing building on the island');
 assert.equal(await page.locator('[data-layer=care].is-paused').count(),1,'retained building is explicitly inactive');
 assert.equal(await page.evaluate(()=>S.enacted.length),0,'retained artwork does not retain the removed policy');
 const carePos=await page.locator('[data-layer=care]').getAttribute('style');
 await govern(page,['q7']);
 assert.equal(await page.locator('.isle-bld').count(),2,'new service grows the same island');
 assert.equal(await page.locator('[data-layer=care]').getAttribute('style'),carePos,'old building remains at its original position and size');
 assert.equal(await page.locator('[data-layer=school].is-active').count(),1);
 const schoolPos=await page.locator('[data-layer=school]').getAttribute('style');
 if(shots)await page.locator('.isle').screenshot({path:path.join(shots,'island-retained-390.png'),style:'.actionbar,.hud{visibility:hidden}'});
 await govern(page,['p5']);
 assert.equal(await page.locator('[data-layer=care].is-active').count(),1,'restarting a service reuses the original building');
 assert.equal(await page.locator('[data-layer=care]').getAttribute('style'),carePos);
 await govern(page,['p6']);
 assert.equal(await page.locator('[data-layer=school]').getAttribute('style'),schoolPos,'other construction remains unchanged');
 assert.equal(await page.locator('.isle-bld').count(),2,'same-type policies expand the original site');
 assert((await page.locator('[data-layer=care]').evaluate(el=>parseFloat(el.style.width)))>15,'additional care service expands its existing site');
 const repeated=await page.locator('.isle-scene').innerHTML();await page.evaluate(()=>render());assert.equal(await page.locator('.isle-scene').innerHTML(),repeated,'rerendering does not change the island');
 assert.deepEqual(errors,[]);await ctx.close();results.push({persistentConstruction:true,passed:true});
 const moving=await open(390,'no-preference');
 const track=moving.page.locator('.broadcast-ticker-track');
 assert.equal(await track.count(),1,'news ticker has a scrolling track');
 const before=await track.evaluate(el=>getComputedStyle(el).transform);await moving.page.waitForTimeout(250);
 assert.notEqual(await track.evaluate(el=>getComputedStyle(el).transform),before,'ticker moves horizontally');
 await moving.page.getByRole('button',{name:'暫停島上動態跑馬燈'}).click();
 assert.equal(await track.evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
 // CSS pause reaches the compositor asynchronously; wait for its pending pause task.
 await track.evaluate(el=>Promise.all(el.getAnimations().map(a=>a.ready)));
 const stopped=await track.evaluate(el=>getComputedStyle(el).transform);await moving.page.waitForTimeout(150);assert.equal(await track.evaluate(el=>getComputedStyle(el).transform),stopped);
 await moving.page.getByRole('button',{name:'繼續島上動態跑馬燈'}).click();assert.equal(await track.evaluate(el=>getComputedStyle(el).animationPlayState),'running');
 assert.deepEqual(moving.errors,[]);await moving.ctx.close();results.push({movingAndPausableTicker:true,passed:true});
 for(const [width,scheme] of [[360,'light'],[390,'dark'],[1280,'light']]){
  const view=await open(width,'reduce',scheme);
  assert.equal(await view.page.locator('.broadcast-ticker-track').evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(await view.page.locator('.broadcast-ticker-copy[aria-hidden=true]').isVisible(),false);
  assert.match(await view.page.locator('.broadcast-ticker').innerText(),/移工阿蒂.*投票權/);
  assert.equal(await view.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no page overflow');
  if(shots)await view.page.locator('.broadcast-ticker').screenshot({path:path.join(shots,`ticker-${width}-${scheme}.png`),style:'.actionbar,.hud{visibility:hidden}'});
  assert.deepEqual(view.errors,[]);await view.ctx.close();results.push({width,scheme,reducedMotionReadable:true,passed:true});
 }
 console.log(JSON.stringify({target,results},null,2));if(shots)fs.writeFileSync(path.join(shots,'results.json'),JSON.stringify({target,results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close()});
