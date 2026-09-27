import { test, expect, type Page } from "@playwright/test";

// Sample rendered pixels instead of asserting the same blur math the product uses.
const contrastAt = async (page: Page, x: number) => {
  const shot = await page.screenshot();
  return page.evaluate(
    async ({ data, x }) => {
      const image = new Image();
      image.src = data;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 400;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(x - 8, 190, 16, 20).data;
      const values = Array.from({ length: pixels.length / 4 }, (_, i) => pixels[i * 4]);
      return Math.max(...values) - Math.min(...values);
    },
    { data: "data:image/png;base64," + shot.toString("base64"), x },
  );
};

test("defocus follows camera depth and a camera dolly lands back on the focal plane", async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 400 });
  await page.goto("/tests/fixtures/focus.html");
  const content = page.locator("[data-seene-content]");
  // The tilted plane starts on the focal plane, so it renders sharp.
  await expect(content).toHaveCSS("filter", "none");
  expect(await contrastAt(page, 400)).toBeGreaterThan(220);
  await page.getByRole("button", { name: "Move focus" }).click();
  // Racking focus past the plane defocuses its whole surface, edges included.
  await expect(content).toHaveCSS("filter", "blur(6px)");
  expect(await contrastAt(page, 250)).toBeLessThan(150);
  expect(await contrastAt(page, 400)).toBeLessThan(150);
  expect(await contrastAt(page, 550)).toBeLessThan(150);
  await page.getByRole("button", { name: "Dolly camera" }).click();
  // The camera travels until the plane reaches the new focal distance.
  await expect(content).toHaveCSS("filter", "none");
  expect(await contrastAt(page, 400)).toBeGreaterThan(220);
});

test("defocus ignores screen position, lateral camera travel and plane tilt", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 400 });
  await page.goto("/tests/fixtures/focus.html");
  const content = page.locator("[data-seene-content]");
  await page.getByRole("button", { name: "Move focus" }).click();
  await expect(content).toHaveCSS("filter", "blur(6px)");
  await page.getByRole("button", { name: "Move surface" }).click();
  // Sliding the surface sideways cannot change its distance from the camera.
  await expect(content).toHaveCSS("filter", "blur(6px)");
  expect(await contrastAt(page, 346)).toBeLessThan(150);
  expect(await contrastAt(page, 646)).toBeLessThan(150);
  await page.getByRole("button", { name: "Pan camera" }).click();
  await expect(content).toHaveCSS("filter", "blur(6px)");
  expect(await contrastAt(page, 400)).toBeLessThan(150);
  await page.getByRole("button", { name: "Tilt surface" }).click();
  // A re-tilted plane stays uniformly defocused instead of gaining a focus gradient.
  await expect(content).toHaveCSS("filter", "blur(6px)");
  expect(await contrastAt(page, 400)).toBeLessThan(150);
});

test("equal-depth screen-separated leaves are sharp while a registered background is blurred", async ({page})=>{
 await page.setViewportSize({width:800,height:400});await page.goto('/tests/fixtures/focus.html?planes');
 const values=[];
 for(const id of ['left','right','background']) {
  const box=await page.getByTestId(id).boundingBox();
  const shot=await page.screenshot();
  values.push(await page.evaluate(async ({data,x,y})=>{
   const image=new Image();image.src=data;await image.decode();const canvas=document.createElement('canvas');canvas.width=800;canvas.height=400;const c=canvas.getContext('2d')!;c.drawImage(image,0,0);const pixels=c.getImageData(x-10,y-10,20,20).data;const v=Array.from({length:pixels.length/4},(_,i)=>pixels[i*4]);return Math.max(...v)-Math.min(...v);
  },{data:'data:image/png;base64,'+shot.toString('base64'),x:Math.round(box!.x+box!.width/2),y:Math.round(box!.y+box!.height/2)}));
 }
 expect(values[0]).toBeGreaterThan(220);expect(values[1]).toBeGreaterThan(220);expect(values[2]).toBeLessThan(25);
 await expect(page.locator('[data-seene-diagnostics]')).toHaveCount(0);
});
