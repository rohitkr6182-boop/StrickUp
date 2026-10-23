import { localDateKey } from './dates.js';
import { calculateCurrentStreak, calculateLongestStreak, calculateLongestWeeklyStreak, calculateWeeklyStreak, shiftDateKey, startOfWeekKey } from './dates.js';

export function isHabitCompleted(completions, habitId, date = localDateKey()) {
  return completions.some((completion) => completion.habitId === habitId && completion.date === date);
}

export function getHabitCompletionsForDate(completions, date = localDateKey()) {
  return completions.filter((completion) => completion.date === date);
}

export function completionPercent(habits, completions, date = localDateKey()) {
  const activeHabits = habits.filter((habit) => !habit.archived);
  if (activeHabits.length === 0) return 0;
  const completeCount = activeHabits.filter((habit) => isHabitCompleteForPeriod(habit, completions, date)).length;
  return Math.round((completeCount / activeHabits.length) * 100);
}

export function isHabitCompleteForPeriod(habit, completions, date = localDateKey(), weekStartsOn = 1) {
  if (habit.frequency !== 'weekly') return isHabitCompleted(completions, habit.id, date);
  const start = startOfWeekKey(date, weekStartsOn);
  const end = shiftDateKey(start, 6);
  return completions.some((completion) => {
    return completion.habitId === habit.id && completion.date >= start && completion.date <= end;
  });
}

export function habitCurrentStreak(habit, completions, today = localDateKey()) {
  const dates = completions.filter((completion) => completion.habitId === habit.id).map((completion) => completion.date);
  return habit.frequency === 'weekly'
    ? calculateWeeklyStreak(dates, today)
    : calculateCurrentStreak(dates, today);
}

export function habitLongestStreak(habit, completions) {
  const dates = completions.filter((completion) => completion.habitId === habit.id).map((completion) => completion.date);
  return habit.frequency === 'weekly'
    ? calculateLongestWeeklyStreak(dates)
    : calculateLongestStreak(dates);
}
