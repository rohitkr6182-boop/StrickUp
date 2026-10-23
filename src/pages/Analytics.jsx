import { useMemo } from 'react';
import { addDays, eachDayOfInterval, format, startOfMonth, startOfWeek } from 'date-fns';
import { BarChart3, CalendarDays, CheckCircle2, Flame, Timer } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, EmptyState } from '../components/UI.jsx';
import { calculateCurrentStreak, calculateWeeklyStreak, formatDuration, localDateKey } from '../lib/dates.js';
import { useApp } from '../state/AppContext.jsx';

function PageHeading({ eyebrow, title, detail }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2><p>{detail}</p></div></div>;
}

function MetricCard({ label, value, detail, icon: Icon, tone = 'green' }) {
  return <Card className="metric-card"><div className={`metric-icon metric-${tone}`}><Icon size={18} /></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></Card>;
}

function buildAnalytics(data) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const week = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const weekly = week.map((day) => {
    const key = localDateKey(day);
    return {
      label: format(day, 'EEE'),
      habits: data.completions.filter((item) => item.date === key).length,
      study: Math.round(data.studySessions.filter((item) => item.date === key).reduce((sum, item) => sum + Number(item.durationSeconds || 0), 0) / 60),
      coding: data.codingEntries.filter((item) => item.solvedOn === key).length,
    };
  });
  const monthDays = eachDayOfInterval({ start: startOfMonth(today), end: today });
  const monthly = monthDays.map((day) => {
    const key = localDateKey(day);
    return {
      label: format(day, 'd'),
      habits: data.completions.filter((item) => item.date === key).length,
      study: Math.round(data.studySessions.filter((item) => item.date === key).reduce((sum, item) => sum + Number(item.durationSeconds || 0), 0) / 60),
      coding: data.codingEntries.filter((item) => item.solvedOn === key).length,
    };
  });
  return { weekly, monthly };
}

function ActivityChart({ data, dataKey, color, name }) {
  if (!data.some((entry) => entry[dataKey] > 0)) {
    return <div className="chart-empty"><BarChart3 size={22} /><p>There’s no activity in this range yet. Log a little progress and it’ll show up here.</p></div>;
  }
  return <div className="chart-wrap"><ResponsiveContainer width="100%" height={230}><AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
    <defs><linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.24} /><stop offset="100%" stopColor={color} stopOpacity={0.01} /></linearGradient></defs>
    <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#e8ece7" />
    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#849089', fontSize: 11 }} minTickGap={20} />
    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#849089', fontSize: 11 }} />
    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e8ece7', boxShadow: '0 8px 24px rgba(38,65,51,.1)' }} formatter={(value) => [value, name]} />
    <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#fill-${dataKey})`} activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }} />
  </AreaChart></ResponsiveContainer></div>;
}

export default function InsightsPage() {
  const { data } = useApp();
  const { weekly, monthly } = useMemo(() => buildAnalytics(data), [data]);
  const last7Keys = Array.from({ length: 7 }, (_, index) => localDateKey(addDays(new Date(), index - 6)));
  const activeHabits = data.habits.filter((habit) => !habit.archived);
  const dailyHabits = activeHabits.filter((habit) => habit.frequency !== 'weekly');
  const weeklyHabits = activeHabits.filter((habit) => habit.frequency === 'weekly');
  const dailyHabitIds = new Set(dailyHabits.map((habit) => habit.id));
  const last7Completions = data.completions.filter((item) => dailyHabitIds.has(item.habitId) && last7Keys.includes(item.date)).length;
  const weeklyHabitCompletions = weeklyHabits.filter((habit) => data.completions.some((entry) => entry.habitId === habit.id && last7Keys.includes(entry.date))).length;
  const expectedCompletions = dailyHabits.length * 7 + weeklyHabits.length;
  const weeklyPercent = expectedCompletions ? Math.round(((last7Completions + weeklyHabitCompletions) / expectedCompletions) * 100) : 0;
  const studyTotal = data.studySessions.reduce((sum, item) => sum + Number(item.durationSeconds || 0), 0);
  const currentStreak = Math.max(0, ...dailyHabits.map((habit) => calculateCurrentStreak(data.completions.filter((item) => item.habitId === habit.id).map((item) => item.date))));
  const weeklyStreak = Math.max(0, ...activeHabits.map((habit) => calculateWeeklyStreak(data.completions.filter((item) => item.habitId === habit.id).map((item) => item.date))));
  return <div className="page-stack">
    <PageHeading eyebrow="YOUR DATA, MADE CLEAR" title="A little perspective" detail="These views are calculated from what you’ve actually logged. No guesswork, no filler." />
    <div className="metric-grid insights-metrics"><MetricCard label="Habit completion" value={`${weeklyPercent}%`} detail="Last 7 days, active habits" icon={CheckCircle2} /><MetricCard label="Focused study" value={`${(studyTotal / 3600).toFixed(1)}h`} detail="All recorded sessions" icon={Timer} tone="peach" /><MetricCard label="Current daily streak" value={`${currentStreak}d`} detail="Best active habit" icon={Flame} tone="gold" /><MetricCard label="Weekly streak" value={`${weeklyStreak}w`} detail="Consecutive active weeks" icon={CalendarDays} tone="lavender" /></div>
    <div className="insights-grid"><Card className="chart-card"><div className="card-heading"><div><div className="eyebrow">THIS WEEK</div><h3>Daily activity</h3></div><span className="chart-caption">Habits completed</span></div><ActivityChart data={weekly} dataKey="habits" color="#4e8769" name="Completions" /></Card><Card className="chart-card"><div className="card-heading"><div><div className="eyebrow">THIS MONTH</div><h3>Study minutes</h3></div><span className="chart-caption">Minutes focused / day</span></div><ActivityChart data={monthly} dataKey="study" color="#e29271" name="Minutes" /></Card></div>
    <Card className="chart-card"><div className="card-heading"><div><div className="eyebrow">ALL TIME</div><h3>Your tracked activity</h3></div></div><div className="tracked-summary"><div><span>Habit completion records</span><strong>{data.completions.length}</strong></div><div><span>Study sessions</span><strong>{data.studySessions.length}</strong></div><div><span>Coding problems</span><strong>{data.codingEntries.length}</strong></div><div><span>Total focused time</span><strong>{formatDuration(studyTotal).slice(0, 5)}</strong></div></div></Card>
  </div>;
}
