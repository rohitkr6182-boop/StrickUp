import { describe, expect, it } from 'vitest';
import { completionPercent, getHabitCompletionsForDate, habitCurrentStreak, habitLongestStreak, isHabitCompleteForPeriod, isHabitCompleted } from './habits.js';

describe('habit completion calculations', () => {
  const habits = [{ id: 'read' }, { id: 'code' }, { id: 'archived', archived: true }];
  const completions = [{ id: 'c1', habitId: 'read', date: '2025-02-01' }, { id: 'c2', habitId: 'code', date: '2025-01-31' }];

  it('matches habit and local date, and filters the selected day', () => {
    expect(isHabitCompleted(completions, 'read', '2025-02-01')).toBe(true);
    expect(isHabitCompleted(completions, 'code', '2025-02-01')).toBe(false);
    expect(getHabitCompletionsForDate(completions, '2025-01-31')).toHaveLength(1);
  });

  it('calculates percentage from active habits only and handles an empty list', () => {
    expect(completionPercent(habits, completions, '2025-02-01')).toBe(50);
    expect(completionPercent([], [], '2025-02-01')).toBe(0);
  });

  it('treats weekly habits as complete for their calendar week and calculates weekly streaks', () => {
    const weeklyHabit = { id: 'weekly-read', frequency: 'weekly' };
    const weeklyLogs = [
      { habitId: 'weekly-read', date: '2025-01-06' },
      { habitId: 'weekly-read', date: '2025-01-13' },
    ];
    expect(isHabitCompleteForPeriod(weeklyHabit, weeklyLogs, '2025-01-15')).toBe(true);
    expect(isHabitCompleteForPeriod(weeklyHabit, weeklyLogs, '2025-01-20')).toBe(false);
    expect(habitCurrentStreak(weeklyHabit, weeklyLogs, '2025-01-20')).toBe(2);
    expect(habitLongestStreak(weeklyHabit, weeklyLogs)).toBe(2);
  });
});
