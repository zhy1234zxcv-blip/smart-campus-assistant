/*
 * 全局数据上下文
 * 课程/事件跨页面共享，一天最多自动刷新一次
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import api from '../services/api';
import type { Course, AppEvent } from '../types';

interface DataContextType {
  courses: Course[];
  events: AppEvent[];
  suggestions: string[];
  loading: boolean;
  refreshCourses: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshSuggestions: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  const fetchSuggestions = async (showToast = false) => {
    try {
      const key = localStorage.getItem('ai_api_key') || '';
      const model = localStorage.getItem('ai_model') || '';
      const prompt = localStorage.getItem('ai_prompt') || '';
      const params = new URLSearchParams();
      if (key) { params.set('apiKey', key); params.set('model', model); }
      if (prompt) params.set('prompt', prompt);
      const qs = params.toString();
      const r = await api.get(`/suggestions${qs ? '?' + qs : ''}`);
      setSuggestions(r.data.tips || []);
      return true;
    } catch { return false; }
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    setLoading(true);

    api.get('/courses').then(r => setCourses(r.data || []))
      .catch(() => {}).finally(() => setLoading(false));

    api.get('/events').then(r => setEvents(r.data || []))
      .catch(() => {});

    fetchSuggestions(); // 静默获取，不弹 toast
  }, []);

  const refreshCourses = useCallback(async () => {
    try { const r = await api.get('/courses'); setCourses(r.data || []); } catch {}
  }, []);

  const refreshEvents = useCallback(async () => {
    try { const r = await api.get('/events'); setEvents(r.data || []); } catch {}
  }, []);

  const refreshSuggestions = useCallback(async () => {
    return fetchSuggestions(true); // 手动刷新，返回结果让调用方弹 toast
  }, []);

  const value = useMemo(() => ({
    courses, events, suggestions, loading, refreshCourses, refreshEvents, refreshSuggestions
  }), [courses, events, suggestions, loading, refreshCourses, refreshEvents, refreshSuggestions]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
}
