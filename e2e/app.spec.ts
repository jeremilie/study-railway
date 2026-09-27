import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("desktop scene, keyboard controls and accessibility", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good things take a little focus." }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Select station The world of cells",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Reset camera", exact: true }).click();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    accessibility.violations.map((v) => ({
      id: v.id,
      description: v.description,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(errors).toEqual([]);
  await page.getByRole("button", { name: "Play nature sounds" }).click();
  await expect(
    page.getByRole("button", { name: "Pause nature sounds" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause nature sounds" }).click();
});

test("timer pauses across reload, resumes, completes once, and offers a break", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Begin focus journey" }).click();
  await page.clock.fastForward(65000);
  await page.getByRole("button", { name: "Pause journey" }).click();
  await expect(page.getByRole("timer")).toHaveAttribute(
    "aria-label",
    /23 minutes/,
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resume journey" }),
  ).toBeVisible();
  await page.clock.fastForward(100000);
  await expect(page.getByRole("timer")).toHaveAttribute(
    "aria-label",
    /23 minutes/,
  );
  await page.getByRole("button", { name: "Resume journey" }).click();
  await page.clock.fastForward(10000);
  await page
    .getByRole("button", { name: "Complete session", exact: true })
    .click();
  await expect(
    page.getByText("1 of 4 focus sessions", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Short break", exact: true }).click();
  await page.getByRole("button", { name: "Take a peaceful break" }).click();
  await page.clock.fastForward(301000);
  await expect(
    page.getByRole("button", { name: "Take a peaceful break" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Journey journal", exact: true })
    .click();
  await expect(page.locator(".history-list li")).toHaveCount(1);
  await page.reload();
  await page
    .getByRole("button", { name: "Journey journal", exact: true })
    .click();
  await expect(page.locator(".history-list li")).toHaveCount(1);
});

test("planner creates, renames, reorders, completes and deletes destinations and lines", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add subject", exact: true }).click();
  await page.getByLabel("Subject name").fill("Literature");
  await page.getByRole("button", { name: "village", exact: true }).click();
  await page
    .getByRole("button", { name: "Create railway line", exact: true })
    .click();
  await page.getByRole("button", { name: "Add your first station" }).click();
  await page.getByLabel("Station title").fill("Read chapter one");
  await page
    .getByLabel("A note for the journey")
    .fill("Look for the theme of belonging.");
  await page.getByLabel("Planned focus sessions").fill("2");
  await page
    .getByRole("button", { name: "Add station", exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Study planner", exact: true })
    .click();
  await page.getByRole("button", { name: "Add station", exact: true }).click();
  await page.getByLabel("Station title").fill("Write a reflection");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add station", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Move Write a reflection up", exact: true })
    .click();
  await expect(page.locator(".station-list>li").first()).toContainText(
    "Write a reflection",
  );
  await page
    .locator(".station-list>li")
    .first()
    .getByRole("button", { name: "Mark complete", exact: true })
    .click();
  await expect(page.locator(".station-list>li").first()).toContainText(
    "Destination reached",
  );
  await page
    .getByRole("button", { name: "Edit Read chapter one", exact: true })
    .click();
  await page.getByLabel("Station title").fill("Read chapter two");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".station-list")).toContainText("Read chapter two");
  await page
    .getByRole("button", { name: "Edit Literature", exact: true })
    .click({ force: true });
  await page.getByLabel("Subject name").fill("Reading");
  await page
    .getByRole("button", { name: "Choose #ad6f62 color", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Reading", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit Reading", exact: true })
    .click({ force: true });
  await page.getByRole("button", { name: "Delete line", exact: true }).click();
  await page
    .getByRole("button", { name: "Yes, delete line", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Reading", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add subject", exact: true }),
  ).toBeFocused();
});

test("an elapsed focus automatically arrives once, including after the page was closed", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Custom", exact: true }).click();
  await page.getByLabel("Focus (minutes)").fill("1");
  await page.getByRole("button", { name: "Save my rhythm" }).click();
  await page.getByRole("button", { name: "Begin focus journey" }).click();
  await expect(
    page.getByText("Saved on this device", { exact: true }),
  ).toBeVisible();
  await page.goto("about:blank");
  await page.clock.fastForward(61000);
  await page.goto("/");
  await expect(
    page.getByText("1 of 4 focus sessions", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("1 of 4 focus sessions", { exact: true }),
  ).toBeVisible();
});

test("ownership failures are recoverable and a second tab cannot overwrite the journey", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Begin focus journey" }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto("/");
  await expect(
    other.getByRole("heading", {
      name: "Your journey is open in another tab.",
    }),
  ).toBeVisible();
  await page.close();
  await other.getByRole("button", { name: "Continue in this tab" }).click();
  await expect(
    other.getByRole("button", { name: "Begin focus journey" }),
  ).toBeVisible();
});

test("failed Web Locks acquisition shows a retry instead of an endless loading screen", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: {
        request: () => Promise.reject(new Error("Storage access rejected")),
      },
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "We couldn’t open your journey safely.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Try opening again" }),
  ).toBeVisible();
});

test("biomes, lighting and 2D view switch without losing the selected destination", async ({
  page,
}) => {
  await page.goto("/");
  for (const [subject, title] of [
    ["Math", "The Alpine Passage"],
    ["History", "Meadowbrook Village"],
    ["Coding", "The Coastal Way"],
  ]) {
    await page.getByRole("button", { name: subject, exact: true }).click();
    await expect(page.locator(".map-line-label")).toContainText(title);
    await expect(page.locator(".scene-label")).toHaveCount(3);
  }
  await page.getByLabel("Scenery lighting").selectOption("evening");
  await page.screenshot({
    path: "test-results/coast-evening.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await expect(page.locator(".route-2d")).toBeVisible();
  await page.reload();
  await expect(page.locator(".route-2d")).toBeVisible();
  await expect(page.locator(".destination")).toContainText(
    "JavaScript foundations",
  );
});

test("mobile uses a 2D route, custom presets persist, cancellation records nothing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Custom", exact: true }).click();
  await page.getByLabel("Focus (minutes)").fill("1");
  await page.getByLabel("Break (minutes)").fill("1");
  await page.getByRole("button", { name: "Save my rhythm" }).click();
  await page.reload();
  await expect(page.getByRole("timer")).toHaveAttribute(
    "aria-label",
    "01 minutes 00 seconds remaining",
  );
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".route-2d")).toBeVisible();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Begin focus journey" }).click();
  await page
    .getByRole("button", { name: "Cancel session", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Cancel session", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel session", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Journey journal", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A beautiful journey starts small." }),
  ).toBeVisible();
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    accessibility.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});

test("WebGL unavailable still supports the complete study workflow", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl2" || type === "webgl") return null;
      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator(".route-2d")).toBeVisible();
  await page
    .locator(".route-2d")
    .getByRole("button", { name: /Genetics & inheritance/ })
    .click();
  await expect(page.locator(".destination")).toContainText(
    "Genetics & inheritance",
  );
  await page.getByRole("button", { name: "Begin focus journey" }).click();
  await expect(
    page.getByRole("button", { name: "Pause journey" }),
  ).toBeVisible();
});
