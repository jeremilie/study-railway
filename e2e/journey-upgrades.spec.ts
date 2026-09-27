import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function trainValue(
  page: import("@playwright/test").Page,
  expected: number,
  mode: "2d" | "3d" = "2d",
) {
  const target = page.locator(mode === "2d" ? ".route-2d" : "canvas");
  await expect
    .poll(async () => Number(await target.getAttribute("data-train-units")))
    .toBeCloseTo(expected, 3);
}

test("three-session goal keeps the same cumulative train position through all lifecycle controls", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Edit The world of cells", exact: true })
    .click();
  await page.getByLabel("Planned focus sessions").fill("3");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Custom", exact: true }).click();
  await page.getByLabel("Focus (minutes)").fill("1");
  await page.getByRole("button", { name: "Save my rhythm" }).click();
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await trainValue(page, 0);
  await page.getByRole("button", { name: "Begin focus journey" }).click();
  await page.clock.fastForward(60000);
  await trainValue(page, 1 / 3);
  await page.getByRole("button", { name: "Short break", exact: true }).click();
  await page.getByRole("button", { name: "Take a peaceful break" }).click();
  await trainValue(page, 1 / 3);
  await page.getByRole("button", { name: "Finish break", exact: true }).click();
  await trainValue(page, 1 / 3);
  await page.getByRole("button", { name: "Focus", exact: true }).click();
  await page.getByRole("button", { name: "Begin focus journey" }).click();
  await trainValue(page, 1 / 3);
  await page.clock.fastForward(15000);
  await page.getByRole("button", { name: "Pause journey" }).click();
  await trainValue(page, 1.25 / 3);
  await page.reload();
  await trainValue(page, 1.25 / 3);
  await page.getByRole("button", { name: "3D", exact: true }).click();
  await trainValue(page, 1.25 / 3, "3d");
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await trainValue(page, 1.25 / 3);
  await page.getByRole("button", { name: "Resume journey" }).click();
  await page.clock.fastForward(45000);
  await trainValue(page, 2 / 3);
  await page.getByRole("button", { name: "Begin focus journey" }).click();
  await trainValue(page, 2 / 3);
  await page.clock.fastForward(60000);
  await trainValue(page, 1);
  await expect(page.locator(".station-list>li").first()).toContainText(
    "Destination reached",
  );
  await page.reload();
  await trainValue(page, 1);
});

test("a ten-station line expands deterministically and disables additions while retaining edit controls", async ({
  page,
}) => {
  await page.goto("/");
  for (let i = 4; i <= 10; i++) {
    await page
      .getByRole("button", { name: "Add station", exact: true })
      .click();
    await page.getByLabel("Station title").fill(`Forest destination ${i}`);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Add station", exact: true })
      .click();
  }
  await expect(
    page.getByRole("button", { name: "Add station", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Maximum of 10 stations reached.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".scene-label")).toHaveCount(10);
  await page
    .getByRole("button", { name: "Edit Forest destination 10", exact: true })
    .click();
  await page.getByLabel("Station title").fill("The far forest");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.reload();
  await expect(page.locator(".scene-label")).toHaveCount(10);
  await page
    .locator(".map-panel")
    .screenshot({ path: "test-results/expanded-island-ten.png" });
});

test("tundra persists and renders snow scenery in all lighting modes with a readable 2D route", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Add subject", exact: true }).click();
  await page.getByLabel("Subject name").fill("Winter reading");
  await page.getByRole("button", { name: "tundra", exact: true }).click();
  await page
    .getByRole("button", { name: "Create railway line", exact: true })
    .click();
  for (const title of ["First snowfall", "The warm cabin", "Glacier lookout"]) {
    await page
      .getByRole("button", { name: "Add station", exact: true })
      .click();
    await page.getByLabel("Station title").fill(title);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Add station", exact: true })
      .click();
  }
  for (const lighting of ["sunrise", "afternoon", "evening"]) {
    await page.getByLabel("Scenery lighting").selectOption(lighting);
    await expect(page.locator(".scene-label")).toHaveCount(3);
  }
  await page
    .locator(".map-panel")
    .screenshot({ path: "test-results/tundra-evening.png" });
  await page.getByRole("button", { name: "2D", exact: true }).click();
  await page.reload();
  await expect(page.locator(".route-2d.tundra")).toBeVisible();
  const accessibility = await new AxeBuilder({ page })
    .include(".route-2d")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  expect(errors).toEqual([]);
});
