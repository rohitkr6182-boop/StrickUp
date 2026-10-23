import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, Archive, ArrowDownToLine, ArrowRight, BarChart3, BookOpen, CalendarDays,
  Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, Code2, Flame, Leaf, LogOut,
  Menu, Moon, MoreHorizontal, Pencil, Plus, Settings, ShieldCheck, Sparkles, Sun, Timer,
  Trash2, Trophy, X,
} from 'lucide-react';
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth,
  startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { Button, Card, EmptyState, Field, Modal, Notice, SelectField } from '../components/UI.jsx';
import { useApp } from '../state/AppContext.jsx';
import {
  calculateLongestStreak, calculateTimerSeconds,
  formatDuration, localDateKey,
} from '../lib/dates.js';
import { completionPercent, habitCurrentStreak, habitLongestStreak, isHabitCompleteForPeriod } from '../lib/habits.js';
import { newId, nowIso } from '../lib/repository.js';

const InsightsPage = lazy(() => import('./Analytics.jsx'));

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: Activity },
  { to: '/habits', label: 'My habits', icon: CheckCircle2 },
  { to: '/focus', label: 'Focus timer', icon: Timer },
  { to: '/coding', label: 'Coding log', icon: Code2 },
  { to: '/calendar', label: 'Activity calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Insights', icon: BarChart3 },
  { to: '/achievements', label: 'Milestones', icon: Trophy },
];

function todayLabel() {
  return format(new Date(), 'EEEE, MMMM d');
}

function titleForPath(path) {
  return navItems.find((item) => item.to === path)?.label || (path === '/settings' ? 'Settings' : 'Your space');
}

export function WorkspaceLayout() {
  const { user, localMode, dataLoading, error, setError, signOut } = useApp();
  const [mobileNav, setMobileNav] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const title = titleForPath(location.pathname);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (requestError) {
      setLogoutError(requestError.message || 'Could not sign out.');
    }
  };

  return (
    <div className="workspace">
      {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <Link to="/" className="brand workspace-brand"><span className="brand-mark"><Leaf size={18} /></span> streakup</Link>
        <div className="side-label">YOUR SPACE</div>
        <nav className="side-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMobileNav(false)} className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-label">PREFERENCES</div>
          <NavLink to="/settings" onClick={() => setMobileNav(false)} className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}><Settings size={17} /><span>Settings</span></NavLink>
          <div className="sidebar-user"><div className="user-avatar">{(user?.email || 'S').slice(0, 1).toUpperCase()}</div><div className="user-details"><strong>{localMode ? 'Local workspace' : user?.user_metadata?.display_name || user?.email?.split('@')[0]}</strong><span>{localMode ? 'This device only' : user?.email}</span></div><button className="icon-button logout-button" aria-label="Sign out" title="Sign out" onClick={handleLogout}><LogOut size={16} /></button></div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
          <div><span className="topbar-overline">YOUR PERSONAL SPACE</span><h1>{title}</h1></div>
          <div className="topbar-right"><span className="today-pill"><CalendarDays size={14} /> {todayLabel()}</span><Link className="settings-shortcut" to="/settings" aria-label="Settings"><Settings size={18} /></Link></div>
        </header>
        <main className="page-content">
          {localMode && <div className="local-banner"><ShieldCheck size={16} /><span><strong>Local-only workspace</strong> — your records stay in this browser. Connect Supabase in <Link to="/settings">settings</Link> to enable secure cloud sync and accounts.</span></div>}
          {error && <Notice tone="error">{error} <button className="notice-dismiss" aria-label="Dismiss error" onClick={() => setError('')}><X size={14} /></button></Notice>}
          {logoutError && <Notice tone="error">{logoutError}</Notice>}
          {dataLoading ? <div className="loading-block"><span className="spinner" /> Loading your records…</div> : <Workspace />}
        </main>
        <footer className="workspace-footer"><span>One step at a time.</span><span>Made for your long game <Leaf size={13} /></span></footer>
      </div>
    </div>
  );
}

function PageHeading({ eyebrow, title, detail, children }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>{children && <div className="heading-action">{children}</div>}</div>;
}

function MetricCard({ label, value, detail, icon: Icon, tone = 'green' }) {
  return <Card className="metric-card"><div className={`metric-icon metric-${tone}`}><Icon size={18} /></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></Card>;
}

function HabitForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState(initial || { name: '', category: 'Personal', frequency: 'daily', targetMinutes: '' });
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  return <Modal title={initial ? 'Edit your habit' : 'Add a habit'} onClose={onClose}>
    <form className="stack-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, targetMinutes: form.targetMinutes ? Number(form.targetMinutes) : null }); }}>
      <Field label="Habit name" value={form.name} onChange={update('name')} maxLength={80} placeholder="e.g. Read for 20 minutes" required autoFocus />
      <div className="form-two-col">
        <SelectField label="Category" value={form.category} onChange={update('category')}><option>Personal</option><option>Study</option><option>Health</option><option>Mindfulness</option><option>Creative</option><option>Other</option></SelectField>
        <SelectField label="Frequency" value={form.frequency} onChange={update('frequency')}><option value="daily">Daily</option><option value="weekly">Weekly</option></SelectField>
      </div>
      <Field label="Optional time goal (minutes)" type="number" min="1" max="1440" value={form.targetMinutes || ''} onChange={update('targetMinutes')} placeholder="e.g. 20" />
      <div className="modal-actions"><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">{initial ? 'Save changes' : 'Add habit'}</Button></div>
    </form>
  </Modal>;
}

function useHabitActions() {
  const { data, persist, create, remove, toggleCompletion, setError } = useApp();
  const [formInitial, setFormInitial] = useState(undefined);
  const [showForm, setShowForm] = useState(false);
  const saveHabit = async (values) => {
    try {
      const now = nowIso();
      if (formInitial?.id) await persist('habits', { ...formInitial, ...values, updatedAt: now });
      else await create('habits', { ...values, archived: false, icon: 'leaf', color: 'green', createdAt: now, updatedAt: now });
      setShowForm(false);
      setFormInitial(undefined);
    } catch (requestError) { setError(requestError.message); }
  };
  const openNew = () => { setFormInitial(undefined); setShowForm(true); };
  const openEdit = (habit) => { setFormInitial(habit); setShowForm(true); };
  const toggle = async (habit, date = localDateKey()) => {
    try { await toggleCompletion(habit, date); } catch (requestError) { setError(requestError.message); }
  };
  const archive = async (habit) => {
    try { await persist('habits', { ...habit, archived: !habit.archived, updatedAt: nowIso() }); } catch (requestError) { setError(requestError.message); }
  };
  const deleteHabit = async (habit) => {
    if (!window.confirm(`Delete "${habit.name}" and its completion history?`)) return;
    try { await remove('habits', habit.id); } catch (requestError) { setError(requestError.message); }
  };
  return { data, formInitial, showForm, setShowForm, saveHabit, openNew, openEdit, toggle, archive, deleteHabit };
}

function HabitItem({ habit, completed, streak, onToggle, onEdit, onArchive, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  return <div className={`habit-row ${completed ? 'habit-row-done' : ''}`}>
    <button className={`habit-check ${completed ? 'habit-check-done' : ''}`} aria-label={`${completed ? 'Unmark' : 'Mark'} ${habit.name} complete`} onClick={onToggle}>{completed && <Check size={16} />}</button>
    <div className="habit-row-icon"><Leaf size={17} /></div>
    <div className="habit-row-info"><strong>{habit.name}</strong><span>{habit.category} <i /> {habit.frequency === 'weekly' ? 'Weekly' : 'Daily'}{habit.targetMinutes ? ` · ${habit.targetMinutes} min goal` : ''}</span></div>
    {streak > 0 && <div className="habit-streak"><Flame size={14} /> {streak}{habit.frequency === 'weekly' ? 'w' : 'd'}</div>}
    <div className="habit-actions"><button className="icon-button" aria-label={`Options for ${habit.name}`} onClick={() => setShowMenu((open) => !open)}><MoreHorizontal size={18} /></button>
      {showMenu && <div className="row-menu"><button onClick={() => onEdit(habit)}><Pencil size={14} /> Edit</button><button onClick={() => onArchive(habit)}><Archive size={14} /> {habit.archived ? 'Restore' : 'Archive'}</button><button className="danger-text" onClick={() => onDelete(habit)}><Trash2 size={14} /> Delete</button></div>}
    </div>
  </div>;
}

function Dashboard() {
  const { data } = useApp();
  const { openNew, toggle, openEdit, archive, deleteHabit, formInitial, showForm, setShowForm, saveHabit } = useHabitActions();
  const today = localDateKey();
  const activeHabits = data.habits.filter((habit) => !habit.archived);
  const percent = completionPercent(activeHabits, data.completions, today);
  const completedToday = activeHabits.filter((habit) => isHabitCompleteForPeriod(habit, data.completions, today)).length;
  const todayStudy = data.studySessions.filter((session) => session.date === today).reduce((sum, session) => sum + Number(session.durationSeconds || 0), 0);
  const streakLeaders = activeHabits.map((habit) => ({ habit, value: habitCurrentStreak(habit, data.completions, today) })).sort((a, b) => b.value - a.value);
  const topStreak = streakLeaders[0]?.value || 0;
  const topStreakUnit = streakLeaders[0]?.habit.frequency === 'weekly' ? 'weeks' : 'days';
  const longestLeaders = activeHabits.map((habit) => ({ habit, value: habitLongestStreak(habit, data.completions) })).sort((a, b) => b.value - a.value);
  const longest = longestLeaders[0]?.value || 0;
  const longestUnit = longestLeaders[0]?.habit.frequency === 'weekly' ? 'weeks' : 'days';
  const recentStudy = [...data.studySessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 3);

  return <div className="page-stack">
    <section className="welcome-panel"><div><div className="eyebrow">A FRESH PAGE, EVERY DAY</div><h2>Good things grow<br />with <em>showing up.</em></h2><p>Take a look at what you’re building, one small step at a time.</p></div><div className="welcome-art"><span className="welcome-sun" /><div className="welcome-stem"><i /><i /><i /><b /></div><div className="welcome-leaf"><Leaf size={22} /></div></div></section>
    <div className="metric-grid">
      <MetricCard label="Today’s progress" value={`${percent}%`} detail={`${completedToday} of ${activeHabits.length} habits on track this period`} icon={CheckCircle2} />
      <MetricCard label="Study time today" value={`${(todayStudy / 3600).toFixed(1)}h`} detail={`${formatDuration(todayStudy)} focused`} icon={BookOpen} tone="peach" />
      <MetricCard label="Current streak" value={`${topStreak} ${topStreakUnit}`} detail="Best active habit streak" icon={Flame} tone="gold" />
      <MetricCard label="Longest streak" value={`${longest} ${longestUnit}`} detail="Across your habits" icon={Trophy} tone="lavender" />
    </div>
    <div className="dashboard-grid">
      <Card className="today-card"><div className="card-heading"><div><div className="eyebrow">YOUR DAILY PRACTICE</div><h3>Today’s habits</h3></div><Button variant="outline" className="small-button" onClick={openNew}><Plus size={15} /> Add habit</Button></div>
        {activeHabits.length ? <div className="habit-list">{activeHabits.slice(0, 5).map((habit) => <HabitItem key={habit.id} habit={habit} completed={isHabitCompleteForPeriod(habit, data.completions, today)} streak={habitCurrentStreak(habit, data.completions, today)} onToggle={() => toggle(habit)} onEdit={openEdit} onArchive={archive} onDelete={deleteHabit} />)}</div> : <EmptyState icon={Leaf} title="Your first habit starts here" detail="Add one small thing you’d like to make part of your day." action={<Button onClick={openNew}><Plus size={15} /> Create a habit</Button>} />}
        {activeHabits.length > 5 && <Link to="/habits" className="subtle-link">See all {activeHabits.length} habits <ArrowRight size={14} /></Link>}
      </Card>
      <Card className="side-card"><div className="card-heading"><div><div className="eyebrow">KEEP YOUR FLOW</div><h3>Recent focus</h3></div><Link to="/focus" className="circle-arrow"><ArrowRight size={17} /></Link></div>
        {recentStudy.length ? <div className="recent-list">{recentStudy.map((session) => <div className="recent-entry" key={session.id}><span className="recent-icon"><Timer size={16} /></span><div><strong>{session.title}</strong><small>{session.subject || format(new Date(session.startedAt), 'MMM d')}</small></div><b>{formatDuration(session.durationSeconds || 0).slice(0, 5)}</b></div>)}</div> : <EmptyState icon={Timer} title="Ready when you are" detail="Start a focused study session and it’ll show up here." action={<Link to="/focus" className="text-link">Open focus timer <ArrowRight size={14} /></Link>} />}
        <div className="mini-note"><Sparkles size={15} /><span>Every focused minute counts.</span></div>
      </Card>
    </div>
    {showForm && <HabitForm initial={formInitial} onSubmit={saveHabit} onClose={() => setShowForm(false)} />}
  </div>;
}

function HabitsPage() {
  const { data } = useApp();
  const actions = useHabitActions();
  const [filter, setFilter] = useState('active');
  const [category, setCategory] = useState('All categories');
  const today = localDateKey();
  const categories = ['All categories', ...new Set(data.habits.map((habit) => habit.category))];
  const visible = data.habits.filter((habit) => filter === 'all' || (filter === 'archived' ? habit.archived : !habit.archived))
    .filter((habit) => category === 'All categories' || habit.category === category);
  return <div className="page-stack">
    <PageHeading eyebrow="BUILD YOUR ROUTINE" title="Habits, your way" detail="Choose a few things that make your days feel more like yours.">
      <Button onClick={actions.openNew}><Plus size={16} /> Add habit</Button>
    </PageHeading>
    <Card className="habits-page-card">
      <div className="list-toolbar"><div className="filter-tabs">{[['active', 'Active'], ['archived', 'Archived'], ['all', 'Everything']].map(([value, label]) => <button key={value} className={filter === value ? 'filter-active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div><select className="compact-select" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">{categories.map((name) => <option key={name}>{name}</option>)}</select></div>
      {visible.length ? <div className="habit-list">{visible.map((habit) => <HabitItem key={habit.id} habit={habit} completed={isHabitCompleteForPeriod(habit, data.completions, today)} streak={habitCurrentStreak(habit, data.completions, today)} onToggle={() => actions.toggle(habit)} onEdit={actions.openEdit} onArchive={actions.archive} onDelete={actions.deleteHabit} />)}</div> : <EmptyState icon={filter === 'archived' ? Archive : Leaf} title={filter === 'archived' ? 'Nothing archived' : 'No habits in this view'} detail="Try another filter or add a new habit to get started." action={<Button onClick={actions.openNew}><Plus size={15} /> Add a habit</Button>} />}
    </Card>
    {actions.showForm && <HabitForm initial={actions.formInitial} onSubmit={actions.saveHabit} onClose={() => actions.setShowForm(false)} />}
  </div>;
}

function FocusPage() {
  const { activeTimer, setActiveTimer, create, setError } = useApp();
  const [title, setTitle] = useState(activeTimer?.title || '');
  const [subject, setSubject] = useState(activeTimer?.subject || '');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (activeTimer?.status !== 'running') return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeTimer?.status]);
  const elapsed = calculateTimerSeconds(activeTimer, now);
  const start = () => {
    if (!title.trim()) { setError('Add a name for this study session before starting the timer.'); return; }
    setError('');
    setActiveTimer({ id: newId(), title: title.trim(), subject: subject.trim(), startedAt: new Date().toISOString(), elapsedSeconds: 0, status: 'running' });
  };
  const pause = () => setActiveTimer((current) => ({ ...current, elapsedSeconds: calculateTimerSeconds(current), status: 'paused' }));
  const resume = () => setActiveTimer((current) => ({ ...current, startedAt: new Date().toISOString(), status: 'running' }));
  const finish = async () => {
    const seconds = calculateTimerSeconds(activeTimer);
    if (seconds < 1) { setError('Study for at least one second before finishing a session.'); return; }
    try {
      await create('studySessions', {
        title: activeTimer.title, subject: activeTimer.subject || null, startedAt: activeTimer.startedAt,
        endedAt: new Date().toISOString(), durationSeconds: seconds, date: localDateKey(new Date(activeTimer.startedAt)), note: null,
      });
      setActiveTimer(null);
      setTitle('');
      setSubject('');
    } catch (requestError) { setError(requestError.message); }
  };
  return <div className="page-stack">
    <PageHeading eyebrow="MAKE SPACE TO FOCUS" title="A little focus goes far" detail="Start a session when you’re ready. Your time is saved when you finish." />
    <div className="focus-layout"><Card className="timer-card"><div className="timer-orbit"><div className="timer-inner"><span className="timer-status">{activeTimer?.status === 'paused' ? 'PAUSED' : activeTimer?.status === 'running' ? 'IN FOCUS' : 'READY WHEN YOU ARE'}</span><strong>{formatDuration(elapsed)}</strong><span className="timer-caption">{activeTimer?.title || 'Your next focused moment'}</span></div></div>
      {!activeTimer && <div className="timer-details"><Field label="What are you working on?" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Read chapter three" maxLength={100} /><Field label="Subject (optional)" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Biology" maxLength={80} /></div>}
      {activeTimer && <div className="active-session-label"><span className="session-pulse" /> {activeTimer.subject || 'Study session'} · {activeTimer.status === 'paused' ? 'Take your time' : 'You’re doing great'}</div>}
      <div className="timer-actions">{!activeTimer ? <Button className="timer-main-action" onClick={start}><Timer size={17} /> Start focusing</Button> : <>{activeTimer.status === 'running' ? <Button variant="outline" onClick={pause}><Circle size={15} /> Pause</Button> : <Button onClick={resume}><ArrowRight size={16} /> Resume</Button>}<Button className="finish-button" onClick={finish}><Check size={16} /> Finish session</Button></>}</div>
      <p className="timer-footnote"><ShieldCheck size={14} /> Your running timer survives a page refresh.</p>
    </Card>
    <Card className="focus-history"><div className="card-heading"><div><div className="eyebrow">YOUR RECORD</div><h3>Recent sessions</h3></div><Link to="/analytics" className="text-link">View insights <ArrowRight size={14} /></Link></div><StudyHistory limit={6} /></Card></div>
  </div>;
}

function StudyHistory({ limit = Infinity }) {
  const { data } = useApp();
  const sessions = [...data.studySessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit);
  if (!sessions.length) return <EmptyState icon={BookOpen} title="No study sessions yet" detail="When you finish a focus session, your study history will appear here." />;
  return <div className="study-history">{sessions.map((session) => <div className="study-entry" key={session.id}><span className="study-entry-icon"><BookOpen size={16} /></span><div><strong>{session.title}</strong><small>{session.subject || 'Study'} · {format(new Date(session.startedAt), 'MMM d, yyyy · h:mm a')}</small></div><b>{formatDuration(session.durationSeconds || 0).slice(0, 5)}</b></div>)}</div>;
}

function CodingPage() {
  const { data, create, remove, setError } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState('All platforms');
  const [form, setForm] = useState({ platform: 'LeetCode', problemName: '', problemUrl: '', difficulty: 'Medium', topic: '', language: '', timeSpentMinutes: '' });
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const platforms = ['All platforms', ...new Set(data.codingEntries.map((entry) => entry.platform))];
  const visible = data.codingEntries.filter((entry) => platform === 'All platforms' || entry.platform === platform).sort((a, b) => b.solvedOn.localeCompare(a.solvedOn));
  const submit = async (event) => {
    event.preventDefault();
    try {
      await create('codingEntries', { ...form, problemUrl: form.problemUrl || null, topic: form.topic || null, language: form.language || null, timeSpentMinutes: form.timeSpentMinutes ? Number(form.timeSpentMinutes) : null, solvedOn: localDateKey(), note: null });
      setForm({ platform: 'LeetCode', problemName: '', problemUrl: '', difficulty: 'Medium', topic: '', language: '', timeSpentMinutes: '' });
      setShowForm(false);
    } catch (requestError) { setError(requestError.message); }
  };
  const deleteEntry = async (entry) => {
    if (!window.confirm(`Delete "${entry.problemName}" from your coding log?`)) return;
    try { await remove('codingEntries', entry.id); } catch (requestError) { setError(requestError.message); }
  };
  const solvedThisMonth = data.codingEntries.filter((entry) => entry.solvedOn?.slice(0, 7) === format(new Date(), 'yyyy-MM')).length;
  return <div className="page-stack">
    <PageHeading eyebrow="LOG THE LEARNING" title="Coding practice" detail="A place to notice each problem you take on, wherever you practice."><Button onClick={() => setShowForm(true)}><Plus size={16} /> Log a problem</Button></PageHeading>
    <div className="metric-grid coding-metrics"><MetricCard label="Problems solved" value={data.codingEntries.length} detail="Across all platforms" icon={Code2} /><MetricCard label="This month" value={solvedThisMonth} detail="Problems logged this month" icon={CalendarDays} tone="peach" /><MetricCard label="Platforms" value={new Set(data.codingEntries.map((entry) => entry.platform)).size} detail="Places you practice" icon={Activity} tone="gold" /></div>
    <Card className="coding-table-card"><div className="list-toolbar"><div className="card-heading compact-heading"><div><div className="eyebrow">YOUR PRACTICE LOG</div><h3>Problems</h3></div></div><select className="compact-select" value={platform} onChange={(event) => setPlatform(event.target.value)} aria-label="Filter by coding platform">{platforms.map((name) => <option key={name}>{name}</option>)}</select></div>
      {visible.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Problem</th><th>Platform</th><th>Difficulty</th><th>Topic</th><th>Language</th><th>Time</th><th>When</th><th /></tr></thead><tbody>{visible.map((entry) => <tr key={entry.id}><td>{entry.problemUrl ? <a className="problem-link" href={entry.problemUrl} target="_blank" rel="noreferrer">{entry.problemName} <ArrowRight size={12} /></a> : <strong>{entry.problemName}</strong>}</td><td>{entry.platform}</td><td><span className={`difficulty difficulty-${entry.difficulty.toLowerCase()}`}>{entry.difficulty}</span></td><td>{entry.topic || '—'}</td><td>{entry.language || '—'}</td><td>{entry.timeSpentMinutes ? `${entry.timeSpentMinutes}m` : '—'}</td><td>{format(new Date(`${entry.solvedOn}T12:00:00`), 'MMM d')}</td><td><button className="icon-button danger-icon" aria-label={`Delete ${entry.problemName}`} onClick={() => deleteEntry(entry)}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div> : <EmptyState icon={Code2} title="Your coding log is ready" detail="Log a problem after you solve it. Add platform, difficulty, topic, language, and time spent." action={<Button onClick={() => setShowForm(true)}><Plus size={15} /> Log first problem</Button>} />}
    </Card>
    {showForm && <Modal title="Log a coding problem" onClose={() => setShowForm(false)}><form className="stack-form" onSubmit={submit}><div className="form-two-col"><SelectField label="Platform" value={form.platform} onChange={update('platform')}><option>LeetCode</option><option>Codeforces</option><option>HackerRank</option><option>Codewars</option><option>Other</option></SelectField><SelectField label="Difficulty" value={form.difficulty} onChange={update('difficulty')}><option>Easy</option><option>Medium</option><option>Hard</option></SelectField></div><Field label="Problem name" value={form.problemName} onChange={update('problemName')} maxLength={160} placeholder="e.g. Two Sum" required /><Field label="Problem URL (optional)" type="url" value={form.problemUrl} onChange={update('problemUrl')} placeholder="https://" /><div className="form-two-col"><Field label="Topic" value={form.topic} onChange={update('topic')} maxLength={80} placeholder="e.g. Arrays" /><Field label="Language" value={form.language} onChange={update('language')} maxLength={80} placeholder="e.g. JavaScript" /></div><Field label="Time spent (minutes)" type="number" min="1" max="1440" value={form.timeSpentMinutes} onChange={update('timeSpentMinutes')} placeholder="Optional" /><div className="modal-actions"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit">Save problem</Button></div></form></Modal>}
  </div>;
}

function CalendarPage() {
  const { data } = useApp();
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selected, setSelected] = useState(new Date());
  const firstDay = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const lastDay = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const visibleDays = eachDayOfInterval({ start: firstDay, end: lastDay });
  const dateKey = localDateKey(selected);
  const dailyCompletions = data.completions.filter((entry) => entry.date === dateKey);
  const dailySessions = data.studySessions.filter((entry) => entry.date === dateKey);
  const dailyCoding = data.codingEntries.filter((entry) => entry.solvedOn === dateKey);
  const counts = new Map();
  for (const key of visibleDays.map(localDateKey)) {
    counts.set(key, data.completions.filter((entry) => entry.date === key).length + data.studySessions.filter((entry) => entry.date === key).length + data.codingEntries.filter((entry) => entry.solvedOn === key).length);
  }
  const max = Math.max(0, ...counts.values());
  const level = (count) => count === 0 ? 'heat-0' : count >= max * .75 ? 'heat-4' : count >= max * .5 ? 'heat-3' : count >= max * .25 ? 'heat-2' : 'heat-1';
  return <div className="page-stack">
    <PageHeading eyebrow="NOTICE YOUR RHYTHM" title="Your activity, over time" detail="Every mark comes from something you logged — habits, focused study, or coding practice." />
    <div className="calendar-layout"><Card className="calendar-card"><div className="calendar-toolbar"><button className="icon-button" onClick={() => setMonth((current) => subMonths(current, 1))} aria-label="Previous month"><ChevronLeft size={19} /></button><h3>{format(month, 'MMMM yyyy')}</h3><button className="icon-button" disabled={isSameMonth(month, new Date())} onClick={() => setMonth((current) => addMonths(current, 1))} aria-label="Next month"><ChevronRight size={19} /></button></div>
      <div className="calendar-grid calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">{visibleDays.map((day) => { const key = localDateKey(day); const count = counts.get(key) || 0; const outside = !isSameMonth(day, month); return <button key={key} className={`calendar-day ${level(count)} ${outside ? 'calendar-outside' : ''} ${isSameDay(day, selected) ? 'calendar-selected' : ''} ${isSameDay(day, new Date()) ? 'calendar-today' : ''}`} onClick={() => setSelected(day)} aria-label={`${format(day, 'MMMM d, yyyy')}: ${count} activities`}><span>{format(day, 'd')}</span>{count > 0 && <i />}</button>; })}</div>
      <div className="calendar-legend"><span>Less</span>{[0, 1, 2, 3, 4].map((value) => <i key={value} className={`heat-${value}`} />)}<span>More</span><span className="legend-note">Activity includes habits, study, and coding.</span></div>
      </Card><Card className="day-detail"><div className="eyebrow">DAY IN REVIEW</div><h3>{format(selected, 'EEEE, MMM d')}</h3><div className="day-summary"><span>{dailyCompletions.length} habit {dailyCompletions.length === 1 ? 'completion' : 'completions'}</span><span>{dailySessions.length} study {dailySessions.length === 1 ? 'session' : 'sessions'}</span><span>{dailyCoding.length} coding {dailyCoding.length === 1 ? 'entry' : 'entries'}</span></div>
        {dailyCompletions.map((entry) => <div className="day-item" key={entry.id}><CheckCircle2 size={15} /><span>{data.habits.find((habit) => habit.id === entry.habitId)?.name || 'Habit'}</span><small>Habit</small></div>)}
        {dailySessions.map((entry) => <div className="day-item" key={entry.id}><BookOpen size={15} /><span>{entry.title}</span><small>{formatDuration(entry.durationSeconds || 0).slice(0, 5)}</small></div>)}
        {dailyCoding.map((entry) => <div className="day-item" key={entry.id}><Code2 size={15} /><span>{entry.problemName}</span><small>{entry.difficulty}</small></div>)}
        {!dailyCompletions.length && !dailySessions.length && !dailyCoding.length && <p className="empty-day">No activity logged for this day.</p>}
      </Card></div>
  </div>;
}

const MILESTONES = [
  { code: 'first_habit', title: 'A first step', description: 'Log your first habit completion.', test: (data) => data.completions.length >= 1 },
  { code: 'three_day_streak', title: 'Finding your rhythm', description: 'Build a 3-day habit streak.', test: (data) => getLongestHabitStreak(data) >= 3 },
  { code: 'week_streak', title: 'A week of showing up', description: 'Build a 7-day habit streak.', test: (data) => getLongestHabitStreak(data) >= 7 },
  { code: 'month_streak', title: 'A month in motion', description: 'Build a 30-day habit streak.', test: (data) => getLongestHabitStreak(data) >= 30 },
  { code: 'first_coding', title: 'First problem solved', description: 'Log your first coding problem.', test: (data) => data.codingEntries.length >= 1 },
  { code: 'ten_coding', title: 'Problem solver', description: 'Log 10 coding problems.', test: (data) => data.codingEntries.length >= 10 },
  { code: 'study_five_hours', title: 'Deep work', description: 'Record 5 hours of focused study.', test: (data) => data.studySessions.reduce((sum, item) => sum + Number(item.durationSeconds || 0), 0) >= 18000 },
];

function getLongestHabitStreak(data) {
  return Math.max(0, ...data.habits.filter((habit) => habit.frequency !== 'weekly').map((habit) => calculateLongestStreak(data.completions.filter((item) => item.habitId === habit.id).map((item) => item.date))));
}

function AchievementsPage() {
  const { data, create, setError } = useApp();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const earnedCodes = new Set(data.achievements.map((achievement) => achievement.code));
  const achievedByData = new Set(MILESTONES.filter((milestone) => milestone.test(data)).map((milestone) => milestone.code));
  const checkAchievements = async () => {
    setChecking(true);
    setMessage('');
    try {
      const pending = MILESTONES.filter((milestone) => milestone.test(data) && !earnedCodes.has(milestone.code));
      for (const milestone of pending) await create('achievements', { code: milestone.code, title: milestone.title, description: milestone.description, earnedAt: nowIso(), metadata: {} });
      setMessage(pending.length ? `${pending.length} new ${pending.length === 1 ? 'milestone' : 'milestones'} saved. Nice work.` : 'You’re all caught up — keep going at your own pace.');
    } catch (requestError) { setError(requestError.message); }
    finally { setChecking(false); }
  };
  return <div className="page-stack"><PageHeading eyebrow="CELEBRATE THE PRACTICE" title="Milestones along the way" detail="Small acknowledgements for real work you’ve logged. No pressure to collect them all."><Button onClick={checkAchievements} disabled={checking}><Sparkles size={16} /> {checking ? 'Checking…' : 'Check for milestones'}</Button></PageHeading>
    {message && <Notice tone="success">{message}</Notice>}
    <div className="achievement-grid">{MILESTONES.map((milestone, index) => { const saved = earnedCodes.has(milestone.code); const earned = saved || achievedByData.has(milestone.code); return <Card className={`achievement-card ${earned ? 'achievement-earned' : ''}`} key={milestone.code}><span className={`achievement-icon achievement-icon-${index % 4}`}>{earned ? <Trophy size={21} /> : <Circle size={21} />}</span><div className="achievement-copy"><strong>{milestone.title}</strong><p>{milestone.description}</p>{saved && <small>Earned {format(new Date(data.achievements.find((item) => item.code === milestone.code).earnedAt), 'MMM d, yyyy')}</small>}</div>{earned && <CheckCircle2 className="achievement-check" size={18} />}</Card>; })}</div>
  </div>;
}

function exportCsv(filename, headers, rows) {
  const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const contents = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${contents}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function SettingsPage() {
  const { localMode, cloudConfigured, data, setError } = useApp();
  const [dark, setDark] = useState(() => localStorage.getItem('streakup-theme') === 'dark');
  const [reminders, setReminders] = useState(() => localStorage.getItem('streakup-reminders') === 'true');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('streakup-theme', dark ? 'dark' : 'light');
  }, [dark]);
  const toggleReminders = async () => {
    if (!reminders) {
      if (!('Notification' in window)) { setError('This browser does not support desktop notifications.'); return; }
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') { setError('Notifications were not allowed. You can enable them in your browser settings.'); return; }
      } catch (requestError) { setError(requestError.message); return; }
    }
    const next = !reminders;
    setReminders(next);
    localStorage.setItem('streakup-reminders', String(next));
    setNotice(next ? 'Browser notifications are allowed. StreakUp does not send scheduled reminders from a closed tab.' : 'Browser reminders are turned off.');
  };
  const exportActivity = () => {
    const habitRows = data.completions.map((entry) => {
      const habit = data.habits.find((item) => item.id === entry.habitId);
      return [entry.date, 'Habit completion', habit?.name || 'Deleted habit', habit?.category || '', ''];
    });
    const studyRows = data.studySessions.map((entry) => [entry.date, 'Study session', entry.title, entry.subject || '', entry.durationSeconds || 0]);
    const codingRows = data.codingEntries.map((entry) => [entry.solvedOn, 'Coding problem', entry.problemName, `${entry.platform} · ${entry.difficulty}`, entry.timeSpentMinutes ? Number(entry.timeSpentMinutes) * 60 : '']);
    exportCsv('streakup-activity.csv', ['date', 'activity_type', 'name', 'details', 'duration_seconds'], [...habitRows, ...studyRows, ...codingRows].sort((a, b) => b[0].localeCompare(a[0])));
  };
  const exportStudy = () => exportCsv('streakup-study-history.csv', ['title', 'subject', 'started_at', 'ended_at', 'duration_seconds', 'date'], data.studySessions.map((entry) => [entry.title, entry.subject, entry.startedAt, entry.endedAt, entry.durationSeconds, entry.date]));
  return <div className="page-stack"><PageHeading eyebrow="MAKE IT YOURS" title="Your settings" detail="Set up your space in a way that works for you." />
    <Card className="settings-card"><div className="settings-section"><div className="settings-icon"><Moon size={18} /></div><div className="settings-copy"><strong>Appearance</strong><p>Choose a light or dark workspace.</p></div><button className={`toggle-switch ${dark ? 'toggle-on' : ''}`} role="switch" aria-checked={dark} aria-label="Toggle dark mode" onClick={() => setDark((current) => !current)}><i /></button><span className="settings-end-label">{dark ? <Moon size={15} /> : <Sun size={15} />}{dark ? 'Dark' : 'Light'}</span></div>
      <div className="settings-section"><div className="settings-icon"><Activity size={18} /></div><div className="settings-copy"><strong>Browser reminders</strong><p>Allow StreakUp to show browser notifications. Scheduled reminders require an open tab.</p></div><button className={`toggle-switch ${reminders ? 'toggle-on' : ''}`} role="switch" aria-checked={reminders} aria-label="Toggle browser reminders" onClick={toggleReminders}><i /></button><span className="settings-end-label">{reminders ? 'On' : 'Off'}</span></div>
    </Card>
    <Card className="settings-card"><div className="settings-section settings-section-top"><div className="settings-icon"><ArrowDownToLine size={18} /></div><div className="settings-copy"><strong>Export your records</strong><p>Download CSV files containing your logged activity. Files are generated in your browser.</p></div></div><div className="export-buttons"><Button variant="outline" onClick={exportActivity}><ArrowDownToLine size={15} /> Activity CSV</Button><Button variant="outline" onClick={exportStudy}><ArrowDownToLine size={15} /> Study history CSV</Button></div></Card>
    <Card className="settings-card connection-card"><div className="settings-section settings-section-top"><div className="settings-icon"><ShieldCheck size={18} /></div><div className="settings-copy"><strong>Data & account</strong><p>{cloudConfigured ? localMode ? 'You are using local-only storage. Sign out and log in to connect a Supabase account.' : 'Supabase cloud mode is configured. Your rows are protected by Row Level Security.' : 'Supabase is not configured. Cloud authentication and sync are unavailable until you add project credentials.'}</p></div></div><div className={`connection-status ${cloudConfigured && !localMode ? 'connected' : 'not-connected'}`}><span />{cloudConfigured && !localMode ? 'Cloud configuration detected' : 'Local-only mode'}</div></Card>
    {notice && <Notice tone="success">{notice}</Notice>}
  </div>;
}

export default function Workspace() {
  return <RoutesForWorkspace />;
}

function RoutesForWorkspace() {
  const { pathname } = useLocation();
  if (pathname === '/dashboard') return <Dashboard />;
  if (pathname === '/habits') return <HabitsPage />;
  if (pathname === '/focus') return <FocusPage />;
  if (pathname === '/coding') return <CodingPage />;
  if (pathname === '/calendar') return <CalendarPage />;
  if (pathname === '/analytics') return <Suspense fallback={<div className="loading-block"><span className="spinner" /> Preparing your insights…</div>}><InsightsPage /></Suspense>;
  if (pathname === '/achievements') return <AchievementsPage />;
  if (pathname === '/settings') return <SettingsPage />;
  return <Dashboard />;
}
