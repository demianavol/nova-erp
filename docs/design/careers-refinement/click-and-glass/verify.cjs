const {chromium}=require('C:/Users/bekas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
const dir='docs/design/careers-refinement/click-and-glass/';
const report={layouts:[],interaction:{},errors:[]};
function assert(condition,message){if(!condition)throw new Error(message)}
async function mount(browser,width,height,theme='dark',reduced=false,touch=false){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference',hasTouch:touch,isMobile:touch});
 await context.addInitScript(t=>localStorage.setItem('yuc-site-theme',t),theme);
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');
 await page.locator('#careers').waitFor();
 await page.evaluate(async()=>{await document.fonts.ready;const e=document.querySelector('#careers');scrollTo({top:scrollY+e.getBoundingClientRect().top-110+5,behavior:'instant'})});
 await page.waitForTimeout(700);
 return {page,context};
}
async function selected(page){return await page.locator('.career-benefit-pill.is-active').evaluate(e=>e.className.match(/career-benefit-(growth|impact|team|projects|freedom|learning)/)[1])}
async function settled(page,id){await page.waitForFunction(id=>{const root=document.querySelector('.career-team-film');return root?.dataset.visibleScene===id&&[...root.querySelectorAll('video')].every(v=>v.dataset.scene===id?(!v.paused&&Number(getComputedStyle(v).opacity)>.999):v.paused)},id,{timeout:10000})}
async function metrics(page){return await page.evaluate(()=>{
 const root=document.querySelector('#careers'),orbit=root.querySelector('.career-orbit'),svg=orbit.querySelector('svg'),buttons=[...root.querySelectorAll('.career-benefit-pill')],matrix=svg.getScreenCTM(),dots=[...root.querySelectorAll('.career-milestone-dot')];
 const rect=e=>e.getBoundingClientRect().toJSON();
 const overlaps=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
 const cards=buttons.map((e,i)=>{const r=rect(e);const pt=dots[i]&&new DOMPoint(+dots[i].getAttribute('cx'),+dots[i].getAttribute('cy')).matrixTransform(matrix);return {id:e.className.match(/career-benefit-(growth|impact|team|projects|freedom|learning)/)[1],rect:r,gap:pt?([0,1,5].includes(i)?pt.y-r.bottom:r.top-pt.y):null,centerOffset:pt?Math.abs((r.left+r.right)/2-pt.x):null}});
 const collisions=[];cards.forEach((a,i)=>cards.slice(i+1).forEach(b=>{if(overlaps(a.rect,b.rect))collisions.push([a.id,b.id])}));
 const heading=rect(root.querySelector('.career-heading')),actions=rect(root.querySelector('.career-actions')),pin=rect(root.querySelector('.career-pin')),stage=rect(root.querySelector('.career-stage'));
 return {cards,collisions,heading,actions,pin,stage,sticky:getComputedStyle(root.querySelector('.career-pin')).position==='sticky',svgVisible:getComputedStyle(svg).display!=='none',horizontalOverflow:document.documentElement.scrollWidth>innerWidth,primary:{background:getComputedStyle(root.querySelector('.career-btn-primary')).backgroundImage,filter:getComputedStyle(root.querySelector('.career-btn-primary')).backdropFilter}};
})}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  let page,context;
  const sizes=[[1440,900],[1024,700],[961,700],[1440,768],[641,900],[390,844],[320,740]];
  for(const [width,height] of sizes){
   const r=await mount(browser,width,height,'dark',false,width<=640);page=r.page;context=r.context;
   await page.addStyleTag({content:'.career-benefit-reveal,.career-benefit-pill,.career-benefit-pill::before {transition:none !important}'});
   for(const id of ['growth','impact','team','projects','freedom','learning']){
    if(width<=640)await page.locator('.career-benefit-'+id).tap();else await page.locator('.career-benefit-'+id).click();
    await page.waitForTimeout(750);
    const m=await metrics(page);report.layouts.push({width,height,theme:'dark',active:id,...m});
    assert(!m.horizontalOverflow,`Horizontal overflow ${width} ${id}`);
    assert(!m.collisions.length,`Overlapping cards ${width}x${height} ${id}: ${JSON.stringify(m.collisions)}`);
    if(m.svgVisible){assert(m.cards.every(c=>Math.abs(c.gap-14)<.1&&c.centerOffset<.1),`Unanchored cards ${width} ${id}`)}
    assert(m.cards.every(c=>c.rect.top>=m.heading.bottom-1&&c.rect.bottom<=m.actions.top+1),`Card overlaps heading or CTA ${width} ${id}`);
    if(m.sticky)assert(m.stage.top>=m.pin.top-1&&m.stage.bottom<=m.pin.bottom+1,`Stage clipped ${width}x${height}`);
    if(id==='team'&&(width===1440||width===1024||width===768)){
     await settled(page,'team');await page.screenshot({path:dir+`after-dark-${width}x${height}.png`});
    }
   }
   console.log('Layout passed',width,height);
   if(width===390){await page.setViewportSize({width:390,height:1800});await page.evaluate(()=>{const r=document.querySelector('.career-stage');scrollTo({top:scrollY+r.getBoundingClientRect().top-120,behavior:'instant'})});await page.locator('.career-stage').screenshot({path:dir+'after-dark-mobile.png'})}
   await context.close();
  }
  for(const reduced of [false,true]){
   const r=await mount(browser,1440,900,'light',reduced);page=r.page;context=r.context;
   await page.locator('.career-benefit-impact').click();await page.waitForTimeout(reduced?100:1400);
   assert(await selected(page)==='impact','Light/reduced selection failed');
   const m=await metrics(page);assert(!m.collisions.length,'Light/reduced overlap');
   if(reduced)assert(await page.locator('#careers video').count()===0,'Reduced motion loaded video');
   else await settled(page,'impact');
   await page.screenshot({path:dir+`after-light-${reduced?'reduced':'desktop'}.png`});
   report.layouts.push({width:1440,height:900,theme:'light',reduced,...m});
   await page.locator('.career-btn-secondary').click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');assert(await page.getByRole('dialog').count()===0,'Dialog did not close');
   await page.locator('#future').scrollIntoViewIfNeeded();await page.waitForTimeout(800);
   assert(await page.locator('#future .future-footer,#future .future-cta,#future .future-motion-toggle').count()===0,'Future controls still present');
   if(!reduced)await page.screenshot({path:dir+'after-future.png'});
   report.interaction.futureControlsRemoved=true;
   await context.close();
  }
  assert(!report.errors.length,report.errors.join('\n'));
  report.passed=true;
 }catch(e){report.passed=false;report.failure=e.stack;throw e}finally{fs.writeFileSync(dir+'browser-report.json',JSON.stringify(report,null,2));await browser.close()}
})();
