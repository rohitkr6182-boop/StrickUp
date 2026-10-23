import { describe, expect, it } from 'vitest';
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateLongestWeeklyStreak,
  calculateTimerSeconds,
  calculateWeeklyStreak,
  dateFromKey,
  differenceInCalendarDays,
  formatDuration,
  localDateKey,
  shiftDateKey,
} from './dates.js';

describe('date and streak calculations', () => {
  it('calculates daily streaks across month, year, and leap-day boundaries', () => {
    expect(calculateCurrentStreak(['2024-02-28', '2024-02-29', '2024-03-01'], '2024-03-01')).toBe(3);
    expect(calculateCurrentStreak(['2023-12-31', '2024-01-01'], '2024-01-01')).toBe(2);
  });

  it('allows yesterday as the most recent completion but breaks after a missed day', () => {
    expect(calculateCurrentStreak(['2025-04-09'], '2025-04-10')).toBe(1);
    expect(calculateCurrentStreak(['2025-04-08'], '2025-04-10')).toBe(0);
  });

  it('calculates longest streak without duplicate dates', () => {
    expect(calculateLongestStreak(['2024-02-28', '2024-02-29', '2024-03-01', '2024-03-01', '2024-03-03'])).toBe(3);
  });

  it('calculates longest weekly streaks with multiple completions in one week', () => {
    expect(calculateLongestWeeklyStreak(['2025-01-06', '2025-01-08', '2025-01-13', '2025-01-20', '2025-02-03'])).toBe(3);
  });

  it('counts completed calendar weeks (Monday through Sunday)', () => {
    expect(calculateWeeklyStreak(['2025-01-06', '2025-01-12', '2024-12-30'], '2025-01-12')).toBe(2);
    expect(calculateWeeklyStreak(['2024-12-22'], '2025-01-12')).toBe(0);
    expect(calculateWeeklyStreak(['2025-01-06'], '2025-01-13')).toBe(1);
  });

  it('uses calendar arithmetic independent of daylight-saving hour changes', () => {
    expect(differenceInCalendarDays('2025-03-10', '2025-03-09')).toBe(1);
    expect(shiftDateKey('2024-02-28', 1)).toBe('2024-02-29');
    expect(dateFromKey('2024-02-29').toISOString()).toContain('2024-02-29');
    expect(localDateKey(new Date(2024, 1, 29, 23, 59))).toBe('2024-02-29');
  });
});

describe('timer calculations', () => {
  it('calculates running, paused, and formatted durations', () => {
    expect(calculateTimerSeconds({ startedAt: '2025-01-01T00:00:00.000Z', elapsedSeconds: 20 }, Date.parse('2025-01-01T00:01:05.000Z'))).toBe(85);
    expect(calculateTimerSeconds({ status: 'paused', elapsedSeconds: 85 }, Date.now())).toBe(85);
    expect(formatDuration(3661)).toBe('01:01:01');
    expect(formatDuration(-4)).toBe('00:00:00');
  });
});
