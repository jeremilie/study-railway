import { beforeEach, describe, expect, it, vi } from "vitest";
import { seed, start } from "../lib/model";
import type { StudyData } from "../types/study";
const persistence = vi.hoisted(() => ({
  loadData: vi.fn(),
  saveData: vi.fn(),
}));
vi.mock("../db/db", () => persistence);
import { useStudyStore } from "./useStudyStore";

beforeEach(() => {
  localStorage.clear();
  persistence.loadData.mockReset();
  persistence.saveData.mockReset();
  persistence.loadData.mockResolvedValue(seed());
  persistence.saveData.mockResolvedValue(undefined);
  useStudyStore.setState({
    data: seed(),
    loaded: true,
    error: "",
    saveStatus: "saved",
  });
});

describe("store recovery and action boundaries", () => {
  it("concurrent hydration cannot replace a session started after loading", async () => {
    let first!: (value: StudyData) => void;
    let second!: (value: StudyData) => void;
    persistence.loadData
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            first = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            second = resolve;
          }),
      );
    useStudyStore.setState({ loaded: false });
    const loadingA = useStudyStore.getState().hydrate();
    const loadingB = useStudyStore.getState().hydrate();
    first(seed());
    await loadingA;
    useStudyStore.getState().start("focus");
    if (second) second(seed());
    await loadingB;
    expect(useStudyStore.getState().data.timer?.kind).toBe("focus");
    await vi.waitFor(() =>
      expect(useStudyStore.getState().saveStatus).toBe("saved"),
    );
  });
  it("reconciles an expired focus before a late cancel action", async () => {
    useStudyStore.setState({
      data: start(seed(), "focus", Date.now() - 1500001),
    });
    useStudyStore.getState().cancel();
    expect(useStudyStore.getState().data.timer).toBeNull();
    expect(useStudyStore.getState().data.sessions).toHaveLength(1);
    expect(useStudyStore.getState().data.sessions[0].seconds).toBe(1500);
    await vi.waitFor(() =>
      expect(useStudyStore.getState().saveStatus).toBe("saved"),
    );
  });
  it("retains changes after a failed write and clears the error after retry", async () => {
    persistence.saveData.mockRejectedValueOnce(
      new Error("Storage temporarily unavailable"),
    );
    useStudyStore.getState().saveSubject({
      id: "writing",
      name: "Writing",
      color: "#54866a",
      biome: "forest",
    });
    await vi.waitFor(() =>
      expect(useStudyStore.getState().saveStatus).toBe("error"),
    );
    expect(
      useStudyStore.getState().data.subjects.some((s) => s.id === "writing"),
    ).toBe(true);
    useStudyStore.getState().retrySave();
    await vi.waitFor(() =>
      expect(useStudyStore.getState().saveStatus).toBe("saved"),
    );
    expect(useStudyStore.getState().error).toBe("");
  });
  it("rejects invalid targets and durations and protects timer ownership from edits", async () => {
    const before = useStudyStore.getState().data;
    useStudyStore.getState().settings({ focus: 0 });
    useStudyStore.getState().saveStation({ ...before.stations[0], target: -1 });
    expect(useStudyStore.getState().data).toBe(before);
    useStudyStore.getState().start("focus");
    useStudyStore.getState().selectSubject("math");
    useStudyStore.getState().deleteSubject("biology");
    expect(useStudyStore.getState().data.selectedSubject).toBe("biology");
    expect(useStudyStore.getState().data.subjects).toHaveLength(4);
    await vi.waitFor(() =>
      expect(useStudyStore.getState().saveStatus).toBe("saved"),
    );
  });
});
