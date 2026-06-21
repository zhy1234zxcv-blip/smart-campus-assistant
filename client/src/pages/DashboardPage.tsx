import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { Course, AppEvent } from '../types';
import { Upload, Calendar, ListTodo, BookOpen, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/courses').then(r => setCourses(r.data)),
      api.get('/events').then(r => setEvents(r.data))
    ]).finally(() => setLoading(false));
  }, []);

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date() && !e.isCompleted)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
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
          <div className="text-2xl font-bold text-gray-800">{courses.length}</div>
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

      {/* 课程概览 */}
      {courses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-blue-500" />
            <h3 className="font-semibold text-gray-700">我的课程</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[...new Map(courses.map(c => [c.name, c])).values()].slice(0, 9).map(c => (
              <div key={c.id} className="px-3 py-2 bg-blue-50/50 rounded-lg text-sm text-gray-700 truncate" title={c.name}>
                {c.name}
              </div>
            ))}
            {courses.length > 9 && (
              <div className="px-3 py-2 text-sm text-gray-400">+{courses.length - 9} 更多...</div>
            )}
          </div>
        </div>
      )}

      {/* 即将到来的事件 */}
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
                  e.type === 'exam' ? 'bg-red-500' : e.type === 'campus_run' ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <span className="text-sm text-gray-700 flex-1">{e.title}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(e.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <Upload size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-lg text-gray-500 mb-1">还没有课表</p>
          <p className="text-sm text-gray-400 mb-4">上传课表图片或 PDF，AI 自动识别</p>
          <Link to="/upload" className="inline-flex px-4 py-2 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 transition-colors">
            开始上传
          </Link>
        </div>
      )}
    </div>
  );
}
