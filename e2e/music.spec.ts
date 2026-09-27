import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

declare global {
  interface Window {
    musicTest: {
      elements: HTMLAudioElement[];
      urls: Set<string>;
      loops: number;
      releasePlay?: () => void;
    };
  }
}

test.beforeEach(async ({ page }) => {
  // Observe real browser playback/resources without replacing its behavior.
  await page.addInitScript(() => {
    window.musicTest = { elements: [], urls: new Set(), loops: 0 };
    const NativeAudio = window.Audio;
    window.Audio = class extends NativeAudio {
      constructor(src?: string) {
        super(src);
        window.musicTest.elements.push(this);
        let previous = 0;
        this.addEventListener("timeupdate", () => {
          if (!this.paused && this.currentTime < previous)
            window.musicTest.loops++;
          previous = this.currentTime;
        });
      }
    };
    const create = URL.createObjectURL.bind(URL);
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      window.musicTest.urls.add(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      window.musicTest.urls.delete(url);
      revoke(url);
    };
  });
});

// A local, decodable PCM WAV keeps playback tests independent of remote media.
function waveFile() {
  const samples = 8000;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(16000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    buffer.writeInt16LE(Math.round(500 * Math.sin(i * 0.1)), 44 + i * 2);
  return buffer;
}

async function importTrack(page: Page, name = "Quiet morning.wav") {
  await page
    .getByLabel("Import audio files")
    .setInputFiles({ name, mimeType: "audio/wav", buffer: waveFile() });
  await expect(page.getByLabel("Music track")).toHaveValue(/.+/);
  await expect(
    page.getByLabel("Music track").locator("option:checked"),
  ).toHaveText(name);
}

test("imports, persists, loops, controls volume, and deletes stored audio", async ({
  page,
}) => {
  await page.goto("/");
  await importTrack(page);
  await expect(
    page.getByRole("button", { name: "Play music", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Music volume").fill("31");
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause music", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.musicTest.loops))
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(() => {
      const media = window.musicTest.elements.at(-1)!;
      return { loop: media.loop, volume: media.volume, paused: media.paused };
    }),
  ).toEqual({ loop: true, volume: 0.31, paused: false });
  await page.getByRole("button", { name: "Mute music", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unmute music", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(() => window.musicTest.elements.at(-1)!.muted),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByLabel("Music track").locator("option:checked"),
  ).toHaveText("Quiet morning.wav");
  await expect(page.getByLabel("Music volume")).toHaveValue("31");
  await expect(
    page.getByRole("button", { name: "Play music", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.musicTest.elements.length)).toBe(0);
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause music", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete selected track" }).click();
  await expect(
    page.getByRole("button", { name: "Nature sounds", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(() => ({
      urls: window.musicTest.urls.size,
      paused: window.musicTest.elements.every((media) => media.paused),
    })),
  ).toEqual({ urls: 0, paused: true });
  await page.getByRole("button", { name: "My music", exact: true }).click();
  await expect(
    page.getByText("Import a track to make yourself at home."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play music", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => window.musicTest.elements.at(-1)!.paused),
  ).toBe(true);
  const count = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("study-railway");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const result = await new Promise<number>((resolve, reject) => {
      const request = database
        .transaction("audioTracks")
        .objectStore("audioTracks")
        .count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return result;
  });
  expect(count).toBe(0);
});

test("timer resumes only previously playing music and navigation never autoplays", async ({
  page,
}) => {
  await page.goto("/");
  await importTrack(page);
  await page.getByRole("button", { name: "Begin focus journey" }).click();
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause music", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Pause journey", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play music", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => window.musicTest.elements.at(-1)!.paused),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Resume journey", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause music", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause music", exact: true }).click();
  await page
    .getByRole("button", { name: "Pause journey", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resume journey", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play music", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await page
    .getByRole("button", { name: "Study planner", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play music", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.musicTest.urls.size)).toBe(0);
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await page
    .getByRole("button", { name: "Cancel session", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel session", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play music", exact: true }),
  ).toBeVisible();
});

test("nature sounds pause and resume with focus, then stop on completion", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play nature sounds", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause nature sounds", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Begin focus journey" }).click();
  await page
    .getByRole("button", { name: "Pause journey", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play nature sounds", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Resume journey", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause nature sounds", exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(1501000);
  await expect(
    page.getByRole("button", { name: "Begin focus journey" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play nature sounds", exact: true }),
  ).toBeEnabled();
});

test("track changes release resources and unsupported audio reports a recoverable error", async ({
  page,
}) => {
  await page.goto("/");
  await importTrack(page, "First.wav");
  const first = await page.getByLabel("Music track").inputValue();
  await importTrack(page, "Second.wav");
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause music", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Music track").selectOption(first);
  await expect(
    page.getByRole("button", { name: "Play music", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.musicTest.urls.size)).toBe(0);
  await page.getByLabel("Import audio files").setInputFiles({
    name: "Broken.mp3",
    mimeType: "audio/mpeg",
    buffer: Buffer.from("not decodable audio"),
  });
  await expect(
    page.getByLabel("Music track").locator("option:checked"),
  ).toHaveText("Broken.mp3");
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "This audio could not play",
  );
  expect(await page.evaluate(() => window.musicTest.urls.size)).toBe(0);
  await page.getByLabel("Music track").selectOption(first);
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause music", exact: true }),
  ).toBeVisible();
  const accessibility = await new AxeBuilder({ page })
    .include(".audio-panel")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page
    .locator(".timer-card")
    .screenshot({ path: "test-results/music-panel.png" });
});

test("a late play promise cannot restart paused or deleted music", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    let delayFirst = true;
    HTMLMediaElement.prototype.play = function () {
      const result = play.call(this);
      if (!delayFirst) return result;
      delayFirst = false;
      // Keep native decoding/playback, but hold its completion to expose the race.
      return result.then(
        () =>
          new Promise<void>((resolve) => {
            window.musicTest.releasePlay = resolve;
          }),
      );
    };
  });
  await page.goto("/");
  await importTrack(page);
  await page.getByRole("button", { name: "Begin focus journey" }).click();
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => !!window.musicTest.releasePlay))
    .toBe(true);
  await page
    .getByRole("button", { name: "Pause journey", exact: true })
    .click();
  await page.evaluate(() => window.musicTest.releasePlay!());
  await expect(
    page.getByRole("button", { name: "Play music", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => ({
      urls: window.musicTest.urls.size,
      paused: window.musicTest.elements.every((media) => media.paused),
    })),
  ).toEqual({ urls: 0, paused: true });
  await page
    .getByRole("button", { name: "Resume journey", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause music", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Pause journey", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete selected track" }).click();
  await expect(
    page.getByRole("button", { name: "Nature sounds", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Resume journey", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play nature sounds", exact: true }),
  ).toBeEnabled();
  expect(await page.evaluate(() => window.musicTest.urls.size)).toBe(0);
});
