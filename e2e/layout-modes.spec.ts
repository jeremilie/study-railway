import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("sidebar collapse expands content and restores accessible navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "2D", exact: true }).click();
  const main = page.locator(".app-body");
  const initialWidth = (await main.boundingBox())!.width;
  const toggle = page.getByRole("button", {
    name: "Collapse sidebar",
    exact: true,
  });
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await toggle.click();
  const reopen = page.getByRole("button", {
    name: "Expand sidebar",
    exact: true,
  });
  await expect(reopen).toBeVisible();
  await expect(reopen).toBeFocused();
  await expect(reopen).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toHaveCount(0);
  await expect
    .poll(async () => (await main.boundingBox())!.width)
    .toBeGreaterThan(initialWidth + 150);
  await reopen.press("Enter");
  await expect(toggle).toBeFocused();
  await expect
    .poll(async () => (await main.boundingBox())!.width)
    .toBeCloseTo(initialWidth, 0);
  await page
    .getByRole("button", { name: "Study planner", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Make space for what matters." }),
  ).toBeVisible();
});

test("2D theater contains focus, locks scrolling and returns focus on Escape", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  const route = page.locator(".route-2d");
  const originalRoute = await route.elementHandle();
  const initialWidth = (await route.boundingBox())!.width;
  const expand = page.getByRole("button", { name: "Expand map", exact: true });
  await expand.click();
  const dialog = page.getByRole("dialog", { name: "Expanded railway map" });
  const exit = dialog.getByRole("button", {
    name: "Exit expanded map",
    exact: true,
  });
  await expect(exit).toBeVisible();
  await expect(exit).toBeFocused();
  await expect
    .poll(async () => (await route.boundingBox())!.width)
    .toBeGreaterThan(initialWidth + 100);
  expect(
    await route.evaluate(
      (element, original) => element === original,
      originalRoute,
    ),
  ).toBe(true);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await expect(
    page.getByRole("button", { name: "Begin focus journey" }),
  ).toHaveCount(0);
  const first = dialog.getByRole("button", { name: "3D", exact: true });
  const last = dialog.getByLabel("Scenery lighting");
  await first.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  await dialog.getByRole("button", { name: /Genetics & inheritance/ }).click();
  await expect(
    dialog.getByRole("button", { name: /Genetics & inheritance/ }),
  ).toHaveAttribute("aria-pressed", "true");
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations.map((violation) => violation.id)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(expand).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await expect(page.locator(".destination")).toContainText(
    "Genetics & inheritance",
  );
  await expect(
    page.getByRole("button", { name: "Expand sidebar" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
});

test("3D theater resizes the same canvas and retains a paused journey", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  await page.getByRole("button", { name: "Begin focus journey" }).click();
  await page.getByRole("button", { name: "Pause journey" }).click();
  const time = await page.getByRole("timer").getAttribute("aria-label");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  const original = await canvas.elementHandle();
  const width = await canvas.evaluate((element) => element.width);
  await page.getByRole("button", { name: "Expand map", exact: true }).click();
  await expect
    .poll(async () => canvas.evaluate((element) => element.width))
    .toBeGreaterThan(width);
  expect(
    await canvas.evaluate(
      (element, previous) => element === previous,
      original,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Exit expanded map", exact: true })
    .click();
  await expect
    .poll(async () => canvas.evaluate((element) => element.width))
    .toBe(width);
  expect(
    await canvas.evaluate(
      (element, previous) => element === previous,
      original,
    ),
  ).toBe(true);
  await expect(page.getByRole("timer")).toHaveAttribute("aria-label", time!);
  await expect(
    page.getByRole("button", { name: "Resume journey" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Expand map", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Collapse sidebar" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect
    .poll(async () => canvas.evaluate((element) => element.width))
    .toBeGreaterThan(width);
  expect(
    await canvas.evaluate((element, previous) => element === previous, original),
  ).toBe(true);
  await page.getByRole("button", { name: "Expand map", exact: true }).click();
  await page.getByRole("button", { name: "Zoom out", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Expand map", exact: true }),
  ).toBeFocused();
  expect(
    await canvas.evaluate((element, previous) => element === previous, original),
  ).toBe(true);
  await expect(page.getByRole("timer")).toHaveAttribute("aria-label", time!);
  await expect(
    page.getByRole("button", { name: "Expand sidebar" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile reduced-motion sidebar and theater remain reachable without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const topbar = page.locator(".topbar");
  const initialTop = (await topbar.boundingBox())!.y;
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect
    .poll(async () => (await topbar.boundingBox())!.y)
    .toBeLessThan(initialTop - 100);
  await expect(page.locator(".sidebar")).toHaveCSS("transition-duration", "0s");
  await page.getByRole("button", { name: "Expand map", exact: true }).click();
  const exit = page.getByRole("button", {
    name: "Exit expanded map",
    exact: true,
  });
  await expect(exit).toBeInViewport();
  await expect(page.locator(".route-2d")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 667, height: 375 });
  await expect(exit).toBeInViewport();
  await expect(page.locator(".route-2d")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Expand map", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
});
