import {test,expect} from '@playwright/test';
import {SEENE_BRAND} from '../../src/core/branding';
test('real entry teaches the studio workflow and opens real scenes without fake playback',async({page})=>{
 await page.goto('/');
 await expect(page).toHaveTitle(SEENE_BRAND.title);
 await expect(page.getByRole('heading',{name:'Turn your app into a cinematic experience.'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Play',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Get started'}).click();
 await expect(page.getByRole('heading',{name:'Add Seene to your app'})).toBeVisible();
 await expect(page.getByText('pnpm exec seene init')).toBeVisible();
 await page.getByRole('button',{name:'Next'}).click();
 await expect(page.getByRole('heading',{name:'Open the studio'})).toBeVisible();
 await page.getByRole('button',{name:'Next'}).click();
 await expect(page.getByRole('heading',{name:'Create a scene'})).toBeVisible();
 await page.getByRole('button',{name:'Start creating'}).click();
 const scroller=page.getByRole('region',{name:'Scene library'});
 await expect(scroller).toBeVisible();
 await expect(page.getByRole('heading',{name:'Your scenes'})).toBeVisible();
 await expect(page.getByText('2 scenes',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Play',exact:true})).toHaveCount(0);
 await page.locator('[data-scene-id="website"]').focus();
 await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'Website',exact:true})).toBeVisible();
 await expect(page.getByRole('alert')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Play',exact:true})).toBeEnabled();
 await page.getByRole('link',{name:'Back to scenes',exact:true}).click();
 await expect(scroller).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});
test('one product shell preserves real host context and state through seek and playback controls',async({page})=>{
 let requests=0;page.on('request',request=>{if(request.url().endsWith('/data.json'))requests++});
 await page.goto('/tests/preview/fixture.html');
 // A real request is supplied by the fixture, not by the preview renderer.
 await expect(page.getByRole('heading',{name:'Provider content'})).toBeVisible();
 await expect(page.getByRole('alert')).toHaveCount(0);
 await page.getByRole('button',{name:'Count 0',exact:true}).click();
 await expect(page.getByRole('button',{name:'Count 1',exact:true})).toBeVisible();
 await page.evaluate(()=>{(window as any).originalHost=document.querySelector('[data-testid="host"]')});
 const seek=page.getByRole('slider',{name:'Scene time'});
 await seek.fill('4000');
 await expect(page.getByTestId('scene-time')).toHaveText('0:04 / 0:08');
 expect(await page.evaluate(()=>(window as any).originalHost===document.querySelector('[data-testid="host"]'))).toBe(true);
 expect(requests).toBe(1);
 await page.evaluate(async()=>{await (window as any).__SEENE_CAPTURE__.seek(2000)});
 await expect(seek).toHaveValue('2000');
 await expect(page.getByRole('button',{name:'Play',exact:true})).toBeEnabled();
 await expect(page.locator('[data-seene-capture="scene"]')).toHaveAttribute('data-seene-valid','true');
 await seek.fill('8000');
 await page.getByRole('button',{name:'Replay',exact:true}).click();
 await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.getByRole('button',{name:'Restart',exact:true}).click();
 await expect(seek).toHaveValue('0');
 await page.locator('.seene-export summary').click();
 await page.getByRole('combobox',{name:'Export frame rate'}).selectOption('30');
 await expect(page.locator('.seene-export-panel code')).toContainText('--fps 30');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{if(!(window as any).copyRetried){(window as any).copyRetried=true;throw new Error('Denied')}}}}));
 await page.getByRole('button',{name:'Copy command'}).click();
 await expect(page.getByRole('region',{name:'Export your scene'}).getByRole('status')).toContainText('Select and copy');
 await page.getByRole('button',{name:'Copy command'}).click();
 await expect(page.getByRole('button',{name:'Copied',exact:true})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('.seene-export summary')).toBeFocused();
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.getByRole('button',{name:'Play',exact:true})).toBeVisible();
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
});

test('scene cover fills every viewport and the bottom backdrop progressively blurs real pixels',async({page})=>{
 await page.goto('/tests/preview/fixture.html');
 await expect(page.getByRole('button',{name:'Play',exact:true})).toBeEnabled();
 for(const size of [{width:1920,height:1080},{width:390,height:844},{width:667,height:320}]){
  await page.setViewportSize(size);
  await expect.poll(()=>page.locator('[data-seene-capture="scene"]').boundingBox()).toEqual({x:0,y:0,...size});
  await expect.poll(async()=>(await page.locator('[data-seene-scene]').boundingBox())!.width).toBeGreaterThanOrEqual(size.width-1);
  await expect.poll(async()=>(await page.locator('[data-seene-scene]').boundingBox())!.height).toBeGreaterThanOrEqual(size.height-1);
  const geometry=await page.locator('[data-seene-scene]').boundingBox();
  expect(geometry!.width/geometry!.height).toBeCloseTo(1400/980,3);
 }
 await page.setViewportSize({width:1440,height:1000});
 // A diagnostic pattern on the actual capture viewport isolates backdrop blur
 // from scene depth of field. A tint/gradient alone cannot remove stripe contrast.
 await page.addStyleTag({content:'.seene-canvas{background:repeating-linear-gradient(90deg,#000 0 12px,#fff 12px 24px)!important}.seene-canvas>*{visibility:hidden}'});
 const contrast=async()=>{
  const shot=await page.screenshot();
  return page.evaluate(async data=>{
   const img=new Image();img.src=data;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);
   return [650,760,940].map(y=>{const p=ctx.getImageData(24,y,48,4).data;const values=Array.from({length:p.length/4},(_,i)=>p[i*4]);return Math.max(...values)-Math.min(...values)});
  },'data:image/png;base64,'+shot.toString('base64'));
 };
 // ResizeObserver layout and Chromium's backdrop compositor settle separately.
 // Wait for the rendered result after rapid viewport changes; retain every pixel
 // assertion so missing blur, flat blur and tint-only replacements still fail.
 await expect(async()=>{
  const blurred=await contrast();
  expect(blurred[0]).toBeGreaterThan(240);
  expect(blurred[1]).toBeLessThan(blurred[0]-30);
  expect(blurred[2]).toBeLessThan(blurred[1]-30);
  expect(blurred[2]).toBeLessThan(20);
 }).toPass({timeout:7000});
 await page.addStyleTag({content:'.seene-bottom-blur i{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'});
 await expect.poll(async()=>(await contrast())[2]).toBeGreaterThan(150);
});

test('onboarding stays reachable on small screens and keeps the creator link reachable',async({page})=>{
 await page.goto('/');
 await expect(page).toHaveTitle(SEENE_BRAND.title);
 for(const size of [{width:1440,height:1000},{width:390,height:844},{width:667,height:320},{width:320,height:568}]){
  await page.setViewportSize(size);
  const start=page.getByRole('button',{name:'Get started'});
  await start.scrollIntoViewIfNeeded();
  await expect(start).toBeInViewport();
  const creator=page.getByRole('link',{name:'THATG33K'});
  await creator.scrollIntoViewIfNeeded();
  await expect(creator).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(size.width);
 }
 const creator=page.getByRole('link',{name:'THATG33K'});
 await expect(creator).toHaveAttribute('href',SEENE_BRAND.url);
 await expect(creator).toHaveAttribute('rel','noopener noreferrer');
 await expect(creator).toHaveAttribute('target','_blank');
 await creator.focus();
 await expect(creator).toBeFocused();
 await page.screenshot({path:'test-results/studio-onboarding-mobile.png'});
});

test('catalog keeps native scrolling, row numbering and scene round-trip navigation',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('seene-entered','true'));
 await page.goto('/');
 const scroller=page.getByRole('region',{name:'Scene library'});
 await expect(scroller).toBeVisible();
 await expect(page.getByRole('heading',{name:'Your scenes'})).toBeVisible();
 await expect(page.getByText('2 scenes',{exact:true})).toBeVisible();
 await expect(page.locator('[data-scene-id]')).toHaveCount(2);
 await expect(page.locator('[data-scene-id="acc"]')).toContainText('01');
 await expect(page.locator('[data-scene-id="website"]')).toContainText('02');
 await expect(page.locator('[data-scene-id="website"]')).toContainText('Website');
 await scroller.focus();
 await page.keyboard.press('PageDown');
 await expect.poll(()=>scroller.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
 for(const size of [{width:1440,height:1000},{width:390,height:844}]){
  await page.setViewportSize(size);
  for(const id of ['acc','website']){
   await page.locator('[data-scene-id="'+id+'"]').focus();
   await expect(page.locator('[data-scene-id="'+id+'"]')).toBeInViewport();
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(size.width);
 }
 await page.locator('[data-scene-id="website"]').focus();
 await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'Website',exact:true})).toBeVisible();
 const attribution=page.getByRole('link',{name:'THATG33K on Website (opens in a new tab)'});
 await expect(attribution).toHaveAttribute('href',SEENE_BRAND.url);
 expect(await page.locator('[data-seene-capture="scene"]').getByRole('link').count()).toBe(0);
 await page.locator('.seene-export summary').focus();await page.keyboard.press('Enter');
 const fps=page.getByRole('combobox',{name:'Export frame rate'});
 await expect(fps).toBeFocused();
 await page.keyboard.press('Escape');
 await expect(page.locator('.seene-export summary')).toBeFocused();
 await page.screenshot({path:'test-results/studio-scene-mobile.png'});
 await page.getByRole('link',{name:'Back to scenes',exact:true}).click();
 await expect(scroller).toBeVisible();
 await expect(page.locator('[data-scene-id="website"]')).toBeInViewport();
 await page.goBack();
 await expect(page.getByRole('heading',{name:'Website',exact:true})).toBeVisible();
 await page.reload();
 await expect(page.getByRole('slider',{name:'Scene time'})).toHaveValue('0');
 await page.goto('/?seene-scene=missing');
 await expect(page.getByRole('alert')).toContainText("can't be opened");
 await page.getByRole('link',{name:'go back to all scenes'}).click();
 await expect(page.getByRole('alert')).toHaveCount(0);
 await expect(scroller).toBeVisible();
});
