import { supabase } from './supabase.js';

const TABLES = {
  habits: 'habits',
  completions: 'habit_completions',
  studySessions: 'study_sessions',
  codingEntries: 'coding_entries',
  achievements: 'achievements',
};

const FIELDS = {
  habits: {
    id: 'id', name: 'name', category: 'category', icon: 'icon', color: 'color',
    frequency: 'frequency', targetMinutes: 'target_minutes', archived: 'archived',
    createdAt: 'created_at', updatedAt: 'updated_at',
  },
  completions: {
    id: 'id', habitId: 'habit_id', date: 'completed_on', note: 'note', createdAt: 'created_at',
  },
  studySessions: {
    id: 'id', title: 'title', subject: 'subject', startedAt: 'started_at', endedAt: 'ended_at',
    durationSeconds: 'duration_seconds', date: 'session_date', note: 'note',
  },
  codingEntries: {
    id: 'id', platform: 'platform', problemName: 'problem_name', problemUrl: 'problem_url',
    difficulty: 'difficulty', topic: 'topic', language: 'language', timeSpentMinutes: 'time_spent_minutes',
    solvedOn: 'solved_on', note: 'note',
  },
  achievements: {
    id: 'id', code: 'code', title: 'title', description: 'description', earnedAt: 'earned_at',
    metadata: 'metadata',
  },
};

const LOCAL_KEY = 'streakup-data-v1';
const timestamp = () => new Date().toISOString();

function toDatabase(entity, item, userId) {
  const row = { owner_id: userId };
  for (const [key, column] of Object.entries(FIELDS[entity])) {
    if (Object.hasOwn(item, key)) row[column] = item[key];
  }
  return row;
}

function fromDatabase(entity, row) {
  const item = {};
  for (const [key, column] of Object.entries(FIELDS[entity])) {
    if (Object.hasOwn(row, column)) item[key] = row[column];
  }
  return item;
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
  } catch (error) {
    throw new Error(`Could not read local StreakUp data: ${error.message}`);
  }
}

function writeLocal(data) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch (error) {
    throw new Error(`Could not save local StreakUp data: ${error.message}`);
  }
}

export async function loadEntity(entity, userId, localMode) {
  if (localMode) {
    const data = readLocal();
    return data[entity] || [];
  }
  const { data, error } = await supabase.from(TABLES[entity]).select('*').eq('owner_id', userId);
  if (error) throw error;
  return data.map((row) => fromDatabase(entity, row));
}

export async function saveEntity(entity, item, userId, localMode) {
  const savedItem = { ...item };
  if (localMode) {
    const data = readLocal();
    const items = data[entity] || [];
    const index = items.findIndex((candidate) => candidate.id === savedItem.id);
    if (index < 0) items.push(savedItem);
    else items[index] = savedItem;
    data[entity] = items;
    writeLocal(data);
    return savedItem;
  }
  const row = toDatabase(entity, savedItem, userId);
  const { data, error } = await supabase.from(TABLES[entity]).upsert(row).select().single();
  if (error) throw error;
  return fromDatabase(entity, data);
}

export async function deleteEntity(entity, id, userId, localMode) {
  if (localMode) {
    const data = readLocal();
    data[entity] = (data[entity] || []).filter((item) => item.id !== id);
    writeLocal(data);
    return;
  }
  const { error } = await supabase.from(TABLES[entity]).delete().eq('id', id).eq('owner_id', userId);
  if (error) throw error;
}

export function newId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return timestamp();
}
