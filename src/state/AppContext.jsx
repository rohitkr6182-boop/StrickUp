import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase.js';
import { deleteEntity, loadEntity, newId, nowIso, saveEntity } from '../lib/repository.js';
import { isHabitCompleteForPeriod } from '../lib/habits.js';

const AppContext = createContext(null);
const EMPTY_DATA = { habits: [], completions: [], studySessions: [], codingEntries: [], achievements: [] };
const ENTITIES = Object.keys(EMPTY_DATA);
const TIMER_KEY = 'streakup-active-timer-v1';

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [localMode, setLocalMode] = useState(() => localStorage.getItem('streakup-local-mode') === 'true');
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTimer, setActiveTimer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(TIMER_KEY) || 'null');
    } catch {
      return null;
    }
  });

  const user = session?.user || (localMode ? { id: 'local-user', email: 'Local workspace' } : null);

  const loadAll = useCallback(async (currentUser, isLocal) => {
    if (!currentUser) {
      setData(EMPTY_DATA);
      setDataLoading(false);
      return;
    }
    setDataLoading(true);
    try {
      const entries = await Promise.all(ENTITIES.map((entity) => loadEntity(entity, currentUser.id, isLocal)));
      setData(Object.fromEntries(ENTITIES.map((entity, index) => [entity, entries[index]])));
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Unable to load your data.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (supabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session: initialSession }, error: authError }) => {
        if (!mounted) return;
        if (authError) setError(authError.message);
        setSession(initialSession);
        setLoading(false);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        if (nextSession) {
          setLocalMode(false);
          localStorage.removeItem('streakup-local-mode');
        }
        setLoading(false);
      });
      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }
    setLoading(false);
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!loading) loadAll(user, localMode);
  }, [loading, user?.id, localMode, loadAll]);

  useEffect(() => {
    if (activeTimer) localStorage.setItem(TIMER_KEY, JSON.stringify(activeTimer));
    else localStorage.removeItem(TIMER_KEY);
  }, [activeTimer]);

  const enterLocalMode = () => {
    localStorage.setItem('streakup-local-mode', 'true');
    setLocalMode(true);
    setError('');
  };

  const signIn = async (email, password) => {
    if (!supabaseConfigured) throw new Error('Cloud sign in is not configured. Add the Supabase URL and anon key, or continue in local mode.');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
  };

  const signUp = async (email, password, displayName) => {
    if (!supabaseConfigured) throw new Error('Cloud sign up is not configured. Add the Supabase URL and anon key, or continue in local mode.');
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (authError) throw authError;
  };

  const recoverPassword = async (email) => {
    if (!supabaseConfigured) throw new Error('Password recovery is available after Supabase is configured.');
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (authError) throw authError;
  };

  const resetPassword = async (password) => {
    if (!supabaseConfigured) throw new Error('Password recovery is available after Supabase is configured.');
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) throw authError;
  };

  const signOut = async () => {
    if (localMode) {
      localStorage.removeItem('streakup-local-mode');
      setLocalMode(false);
      setSession(null);
      return;
    }
    if (supabase) {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
    }
  };

  const persist = useCallback(async (entity, item) => {
    if (!user) throw new Error('Sign in or enter local mode before saving.');
    const saved = await saveEntity(entity, item, user.id, localMode);
    setData((current) => {
      const items = current[entity].filter((candidate) => candidate.id !== saved.id);
      return { ...current, [entity]: [...items, saved] };
    });
    return saved;
  }, [user?.id, localMode]);

  const remove = useCallback(async (entity, id) => {
    if (!user) throw new Error('Sign in or enter local mode before deleting.');
    await deleteEntity(entity, id, user.id, localMode);
    setData((current) => ({ ...current, [entity]: current[entity].filter((item) => item.id !== id) }));
    if (entity === 'habits') {
      const related = data.completions.filter((completion) => completion.habitId === id);
      await Promise.all(related.map((completion) => deleteEntity('completions', completion.id, user.id, localMode)));
      setData((current) => ({ ...current, completions: current.completions.filter((item) => item.habitId !== id) }));
    }
  }, [user?.id, localMode, data.completions]);

  const create = useCallback((entity, values) => persist(entity, { id: newId(), ...values }), [persist]);

  const toggleCompletion = async (habit, date) => {
    const existing = data.completions.find((item) => item.habitId === habit.id && isHabitCompleteForPeriod(habit, [item], date));
    if (existing) return remove('completions', existing.id);
    return create('completions', { habitId: habit.id, date, createdAt: nowIso() });
  };

  const value = useMemo(() => ({
    user, localMode, cloudConfigured: supabaseConfigured, data, loading, dataLoading, error,
    setError, activeTimer, setActiveTimer, enterLocalMode, signIn, signUp, recoverPassword, resetPassword, signOut,
    persist, create, remove, toggleCompletion, refresh: () => loadAll(user, localMode),
  }), [user, localMode, data, loading, dataLoading, error, activeTimer, enterLocalMode, signIn, signUp, recoverPassword, resetPassword, signOut, persist, create, remove, loadAll]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
