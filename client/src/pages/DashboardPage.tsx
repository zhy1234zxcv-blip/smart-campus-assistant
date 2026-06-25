import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import type { Course, AppEvent } from '../types';
import { Upload, Calendar, ListTodo, BookOpen, AlertTriangle, Lightbulb, X, User, MapPin, Clock, CalendarDays, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const { courses, events, suggestions, loading, refreshSuggestions } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    const ok = await refreshSuggestions();
    if (ok) { setToast('已刷新'); setTimeout(() => setToast(''), 1800); }
    setRefreshing(false);
  };

  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date() && !e.isCompleted).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0,5);
  const uniqueCourses = [...new Map(courses.map(c => [c.name, c])).values()];

  if (loading && courses.length === 0) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" /></div>;
  }

  return (
    <div className="animate-in max-w-4xl">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800/90 backdrop-blur text-white text-xs px-4 py-2 rounded-full shadow-xl">{toast}</div>}

      <div className="mb-8">
        <h2 className="text-[26px] font-extrabold text-slate-800 tracking-tight">欢迎回来</h2>
        <p className="text-slate-400 mt-1 text-sm">智能管理你的校园课程</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { to: '/upload', icon: Upload, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', value: uniqueCourses.length, label: '门课程' },
          { to: '/calendar', icon: Calendar, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', value: '日历', label: '查看安排' },
          { to: '/events', icon: ListTodo, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', value: events.length, label: '个事件' },
        ].map(({ to, icon: Icon, color, bg, value, label }) => (
          <Link key={to} to={to} className="glass-card p-5 group">
            <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={20} className={label === '查看安排' ? 'text-emerald-600' : label === '个事件' ? 'text-amber-600' : 'text-blue-600'} />
            </div>
            <div className={`text-[28px] font-extrabold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</div>
            <div className="text-[13px] text-slate-400 mt-0.5 font-medium">{label}</div>
          </Link>
        ))}
      </div>

      {/* AI 建议 */}
      {suggestions.length > 0 && (
        <div className="glass-card p-5 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100 to-transparent rounded-full -mr-10 -mt-10 opacity-50" />
          <div className="flex items-center gap-2 mb-3 relative">
            <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center">
              <Lightbulb size={14} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">今日建议</h3>
            <button onClick={handleRefresh} disabled={refreshing}
              className="ml-auto flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-500 transition-all">
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} /> 重新生成
            </button>
          </div>
          <div className="space-y-1.5 relative">
            {suggestions.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-[13px] text-slate-600 leading-relaxed">
                <span className="text-indigo-400 mt-1 flex-shrink-0">•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 课程 */}
      {uniqueCourses.length > 0 && (
        <div className="glass-card p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center"><BookOpen size={14} className="text-blue-600" /></div>
            <h3 className="font-bold text-slate-700 text-sm">我的课程</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueCourses.slice(0, 12).map(c => {
              const count = courses.filter(x => x.name === c.name).length;
              return (
                <button key={c.id} onClick={() => setSelectedCourse(c)}
                  className="px-3 py-1.5 bg-white/80 hover:bg-blue-50 rounded-xl text-[13px] text-slate-600 hover:text-blue-700 transition-all border border-slate-100 hover:border-blue-200 hover:shadow-sm">
                  {c.name}{count > 1 && <span className="text-blue-400 ml-1 text-[11px]">×{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 即将到来 */}
      {upcomingEvents.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center"><AlertTriangle size={14} className="text-amber-600" /></div>
            <h3 className="font-bold text-slate-700 text-sm">即将到来</h3>
          </div>
          <div className="space-y-1.5">
            {upcomingEvents.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/60 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.type === 'exam' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                <span className="text-[13px] text-slate-600 flex-1">{e.title}</span>
                <span className="text-[11px] text-slate-400">{new Date(e.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {uniqueCourses.length === 0 && (
        <div className="glass-card p-16 text-center">
          <Upload size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium mb-1">还没有课表</p>
          <p className="text-[13px] text-slate-400 mb-4">上传课表图片或 PDF，AI 自动识别</p>
          <Link to="/upload" className="btn-primary inline-flex">开始上传</Link>
        </div>
      )}

      {/* 课程弹窗 */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center animate-scale" onClick={() => setSelectedCourse(null)}>
          <div className="glass-card p-6 w-full max-w-sm m-4" onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.95)' }}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{selectedCourse.name}</h3>
                {selectedCourse.teacher && <p className="text-[13px] text-slate-500 mt-0.5">{selectedCourse.teacher}</p>}
              </div>
              <button onClick={() => setSelectedCourse(null)} className="text-slate-300 hover:text-slate-500"><X size={20} /></button>
            </div>
            <div className="space-y-2.5 text-[13px]">
              {selectedCourse.location && <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /><span className="text-slate-600">{selectedCourse.location}</span></div>}
              <div className="flex items-center gap-2"><Clock size={14} className="text-slate-400" /><span className="text-slate-600">周{['日','一','二','三','四','五','六'][selectedCourse.dayOfWeek]} {selectedCourse.startSection}-{selectedCourse.endSection}节</span></div>
              {selectedCourse.weeks && <div className="flex items-center gap-2"><CalendarDays size={14} className="text-slate-400" /><span className="text-slate-600 text-xs">{selectedCourse.weeks}</span></div>}
              {courses.filter(x => x.name === selectedCourse.name).length > 1 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400 mb-2">全部时段</div>
                  {courses.filter(x => x.name === selectedCourse.name).map(c => (
                    <div key={c.id} className="text-[12px] text-slate-500 py-0.5">
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
