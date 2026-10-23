import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
} from 'date-fns';

const DAY_MS = 24 * 60 * 60 * 1000;

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function shiftDateKey(key, amount) {
  const date = dateFromKey(key);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function differenceInCalendarDays(laterKey, earlierKey) {
  return Math.round((Date.parse(`${laterKey}T00:00:00Z`) - Date.parse(`${earlierKey}T00:00:00Z`)) / DAY_MS);
}

export function startOfWeekKey(key, weekStartsOn = 1) {
  const dayOfWeek = dateFromKey(key).getUTCDay();
  const daysSinceStart = (dayOfWeek - weekStartsOn + 7) % 7;
  return shiftDateKey(key, -daysSinceStart);
}

export function calculateCurrentStreak(completedDateKeys, todayKey = localDateKey()) {
  const completed = new Set(completedDateKeys);
  let cursor = completed.has(todayKey) ? todayKey : shiftDateKey(todayKey, -1);
  if (!completed.has(cursor)) return 0;

  let streak = 0;
  while (completed.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

export function calculateLongestStreak(completedDateKeys) {
  const sorted = [...new Set(completedDateKeys)].sort();
  let longest = 0;
  let current = 0;
  let previous = null;
  for (const key of sorted) {
    current = previous && differenceInCalendarDays(key, previous) === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = key;
  }
  return longest;
}

export function calculateLongestWeeklyStreak(completedDateKeys, weekStartsOn = 1) {
  const weeks = [...new Set(completedDateKeys.map((key) => startOfWeekKey(key, weekStartsOn)))].sort();
  let longest = 0;
  let current = 0;
  let previous = null;
  for (const week of weeks) {
    current = previous && differenceInCalendarDays(week, previous) === 7 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = week;
  }
  return longest;
}

export function calculateWeeklyStreak(completedDateKeys, todayKey = localDateKey(), weekStartsOn = 1) {
  const completed = new Set(completedDateKeys);
  let cursor = startOfWeekKey(todayKey, weekStartsOn);
  const completedThisWeek = [...completed].some((key) => startOfWeekKey(key, weekStartsOn) === cursor);
  if (!completedThisWeek) cursor = shiftDateKey(cursor, -7);

  let streak = 0;
  while (true) {
    const hasCompletion = [...completed].some((key) => startOfWeekKey(key, weekStartsOn) === cursor);
    if (!hasCompletion) break;
    streak += 1;
    cursor = shiftDateKey(cursor, -7);
  }
  return streak;
}

export function monthDateKeys(monthDate) {
  const first = startOfMonth(monthDate);
  const last = endOfMonth(monthDate);
  return eachDayOfInterval({ start: first, end: last }).map(localDateKey);
}

export function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return [hours, minutes, remainingSeconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export function calculateTimerSeconds(session, now = Date.now()) {
  if (!session) return 0;
  const start = new Date(session.startedAt).getTime();
  const elapsedBeforePause = Number(session.elapsedSeconds ?? 0);
  if (session.status === 'paused') return elapsedBeforePause;
  return elapsedBeforePause + Math.max(0, Math.floor((now - start) / 1000));
}
