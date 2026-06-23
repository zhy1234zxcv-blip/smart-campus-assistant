import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Course, AppEvent } from '../types';
import { Upload, Calendar, ListTodo, BookOpen, AlertTriangle, Lightbulb, X, User, MapPin, Clock, CalendarDays } from 'lucide-react';

// 本地缓存 key
const CACHE_KEY = 'dashboard_cache';
interface CacheData { courses: Course[]; events: AppEvent[]; suggestions: string[]; time: number; }

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    // 先读缓存，秒开
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as CacheData | null;
      if (cached && cached.courses && Date.now() - cached.time < 3600000) {
        setCourses(cached.courses);
        setEvents(cached.events || []);
        setSuggestions(cached.suggestions || []);
        setLoading(false);
      }
    } catch {}

    // 再拉最新
    Promise.all([
      api.get('/courses').then(r => setCourses(r.data)),
      api.get('/events').then(r => setEvents(r.data)),
      (async () => {
        const key = localStorage.getItem('ai_api_key') || '';
        const model = localStorage.getItem('ai_model') || '';
        const prompt = localStorage.getItem('ai_prompt') || '';
        const params = new URLSearchParams();
        if (key) { params.set('apiKey', key); params.set('model', model); }
        if (prompt) params.set('prompt', prompt);
        const qs = params.toString();
        return api.get(`/suggestions${qs ? '?' + qs : ''}`).then(r => setSuggestions(r.data.tips || []));
      })().catch(() => {}),
    ]).finally(() => {
      setLoading(false);
      // 更新缓存
      const cache: CacheData = { courses, events, suggestions, time: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    });
  }, []);

  // 每次数据变化时更新缓存
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ courses, events, suggestions, time: Date.now() }));
    }
  }, [courses, events, suggestions, loading]);

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date() && !e.isCompleted)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const uniqueCourses = [...new Map(courses.map(c => [c.name, c])).values()];

  if (loading && courses.length === 0) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;
  }

  return (
    <div className="animate-in max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">欢迎回来</h2>
        <p className="text-gray-400 mt-1">智能管理你的校园课程</p>
      </div>

      {/* 快捷卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/upload" className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-200">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
            <Upload className="text-blue-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-800">{uniqueCourses.length}</div>
          <div className="text-sm text-gray-400 mt-0.5">门课程</div>
        </Link>
        <Link to="/calendar" className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-200">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
            <Calendar className="text-green-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-800">日历</div>
          <div className="text-sm text-gray-400 mt-0.5">查看课表安排</div>
        </Link>
        <Link to="/events" className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all duration-200">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-100 transition-colors">
            <ListTodo className="text-orange-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-800">{events.length}</div>
          <div className="text-sm text-gray-400 mt-0.5">个事件</div>
        </Link>
      </div>

      {/* AI 建议 */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} className="text-amber-500" />
            <h3 className="font-semibold text-gray-700">今日建议</h3>
            <span className="text-[10px] text-gray-400 ml-auto">AI</span>
          </div>
          <div className="space-y-2">
            {suggestions.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-400 mt-0.5">•</span><span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 课程概览 */}
      {uniqueCourses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-blue-500" />
            <h3 className="font-semibold text-gray-700">我的课程</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {uniqueCourses.slice(0, 9).map(c => {
              const count = courses.filter(x => x.name === c.name).length;
              return (
                <button key={c.id}
                  onClick={() => setSelectedCourse(c)}
                  className="px-3 py-2 bg-blue-50/50 rounded-lg text-sm text-gray-700 truncate text-left hover:bg-blue-100 transition-colors"
                  title={c.name}>
                  {c.name}
                  {count > 1 && <span className="text-blue-400 ml-1 text-xs">×{count}</span>}
                </button>
              );
            })}
            {uniqueCourses.length > 9 && (
              <div className="px-3 py-2 text-sm text-gray-400">+{uniqueCourses.length - 9} 更多</div>
            )}
          </div>
        </div>
      )}

      {/* 即将到来 */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="font-semibold text-gray-700">即将到来</h3>
          </div>
          <div className="space-y-2">
            {upcomingEvents.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  e.type === 'exam' ? 'bg-red-500' : 'bg-green-500'
                }`} />
                <span className="text-sm text-gray-700 flex-1">{e.title}</span>
                <span className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {uniqueCourses.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <Upload size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-lg text-gray-500 mb-1">还没有课表</p>
          <p className="text-sm text-gray-400 mb-4">上传课表图片或 PDF</p>
          <Link to="/upload" className="inline-flex px-4 py-2 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 transition-colors">开始上传</Link>
        </div>
      )}

      {/* 课程详情弹窗 */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setSelectedCourse(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm m-4 animate-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-lg">{selectedCourse.name}</h3>
              <button onClick={() => setSelectedCourse(null)} className="text-gray-300 hover:text-gray-500"><X size={20} /></button>
            </div>
            <div className="space-y-2 text-sm">
              {selectedCourse.teacher && <div className="flex items-center gap-2"><User size={14} className="text-gray-400" /><span className="text-gray-700">{selectedCourse.teacher}</span></div>}
              {selectedCourse.location && <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /><span className="text-gray-700">{selectedCourse.location}</span></div>}
              <div className="flex items-center gap-2"><Clock size={14} className="text-gray-400" />
                <span className="text-gray-700">周{['日','一','二','三','四','五','六'][selectedCourse.dayOfWeek]} {selectedCourse.startSection}-{selectedCourse.endSection}节</span>
              </div>
              {selectedCourse.weeks && <div className="flex items-center gap-2"><CalendarDays size={14} className="text-gray-400" /><span className="text-gray-700">{selectedCourse.weeks}</span></div>}
              {/* 显示同名课程的所有时段 */}
              {courses.filter(x => x.name === selectedCourse.name).length > 1 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-400 mb-1">全部时段</div>
                  {courses.filter(x => x.name === selectedCourse.name).map((c, i) => (
                    <div key={c.id} className="text-xs text-gray-600">
                      周{['日','一','二','三','四','五','六'][c.dayOfWeek]} {c.startSection}-{c.endSection}节 {c.location || ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
