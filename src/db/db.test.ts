import { afterEach, describe, it, expect } from "vitest";
import { StudyDatabase, loadData, saveData } from "./db";
import { start, finish, removeSubject } from "../lib/model";
const databases: StudyDatabase[] = [];
function database() {
  const db = new StudyDatabase(`test-${crypto.randomUUID()}`);
  databases.push(db);
  return db;
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});
describe("local persistence", () => {
  it("round-trips an active timer and commits progress with session history", async () => {
    const db = database();
    let data = start(await loadData(db), "focus", 1000);
    await saveData(data, db);
    expect((await loadData(db)).timer?.deadline).toBe(1501000);
    data = finish(data, 1501000);
    await saveData(data, db);
    const restored = await loadData(db);
    expect(restored.timer).toBeNull();
    expect(restored.sessions).toHaveLength(1);
    expect(
      restored.stations.find((s) => s.id === data.selectedStation)?.completed,
    ).toBe(1);
  });
  it("never reseeds an intentionally empty journey", async () => {
    const db = database();
    let data = await loadData(db);
    for (const s of data.subjects) data = removeSubject(data, s.id);
    await saveData(data, db);
    expect((await loadData(db)).subjects).toEqual([]);
  });
});
