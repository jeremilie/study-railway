import { describe, it, expect } from 'vitest';
import { seed, remaining, start, pause, resume, finish, removeSubject, dailyStats } from './model';

describe('study journey', () => {
  it('seeds usable routes without fabricated history', () => {
    const data = seed();
    expect(data.subjects).toHaveLength(4);
    expect(data.stations.find(s => s.id === data.selectedStation)?.subjectId).toBe(data.selectedSubject);
    expect(data.sessions).toEqual([]);
  });
  it('uses a deadline, so delayed ticks do not lose elapsed time', () => {
    const data = start(seed(), 'focus', 1000);
    expect(remaining(data.timer!, 91000)).toBe(1410);
    expect(remaining(data.timer!, 99999999)).toBe(0);
  });
  it('pause and resume exclude paused time', () => {
    let data = start(seed(), 'focus', 1000);
    data = pause(data, 61000);
    expect(remaining(data.timer!, 900000)).toBe(1440);
    data = resume(data, 901000);
    expect(remaining(data.timer!, 931000)).toBe(1410);
    data = finish(data, 931000);
    expect(data.sessions[0].seconds).toBe(90);
  });
  it('completes exactly once and caps elapsed study time at the target', () => {
    let data = start(seed(), 'focus', 1000);
    const stationId = data.selectedStation;
    data = finish(data, 1801000);
    data = finish(data, 1802000);
    expect(data.sessions).toHaveLength(1);
    expect(data.sessions[0].seconds).toBe(1500);
    expect(data.stations.find(s => s.id === stationId)?.completed).toBe(1);
    expect(data.timer).toBeNull();
    expect(data.breakReady).toBe(true);
  });
  it('does not count breaks as focus or change station progress', () => {
    let data = start(seed(), 'break', 1000);
    data = finish(data, 301000);
    expect(data.sessions).toHaveLength(0);
    expect(data.stations.every(s => s.completed === 0)).toBe(true);
  });
  it('refuses missing or mismatched station ownership and duplicate starts', () => {
    const data = seed();
    expect(start({ ...data, selectedStation: '' }, 'focus', 0).timer).toBeNull();
    expect(start({ ...data, selectedSubject: 'math' }, 'focus', 0).timer).toBeNull();
    const active = start(data, 'focus', 0);
    expect(start(active, 'focus', 999).timer?.deadline).toBe(active.timer?.deadline);
  });
  it('preserves history when a subject is deleted and supports a truly empty plan', () => {
    let data = finish(start(seed(), 'focus', 0), 1500000);
    for (const subject of data.subjects) data = removeSubject(data, subject.id);
    expect(data.subjects).toEqual([]);
    expect(data.stations).toEqual([]);
    expect(data.selectedStation).toBe('');
    expect(data.sessions).toHaveLength(1);
    expect(start(data, 'focus', 0).timer).toBeNull();
  });
  it('uses local calendar boundaries for daily totals', () => {
    const noon = new Date(2026, 8, 27, 12).getTime();
    let data = finish(start(seed(), 'focus', noon - 1500000), noon);
    data = finish(start(data, 'focus', noon - 86400000 - 1500000), noon - 86400000);
    expect(dailyStats(data, noon)).toEqual({ minutes: 25, sessions: 1, subjects: 1 });
  });
});