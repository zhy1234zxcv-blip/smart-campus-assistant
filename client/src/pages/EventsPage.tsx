import { useEffect, useState, FormEvent } from 'react';
import api from '../services/api';
import type { AppEvent } from '../types';
import { EVENT_TYPE_LABELS } from '../utils/calendarUtils';
import { Plus, Trash2, Check, CalendarClock } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [type, setType] = useState('other');
  const [description, setDescription] = useState('');

  const loadEvents = () => {
    api.get('/events').then(r => setEvents(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadEvents(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/events', { title, date, time: time || undefined, type, description, duration: Number(duration) });
      setShowForm(false);
      setTitle(''); setDate(''); setTime(''); setDuration('60'); setType('other'); setDescription('');
      loadEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/events/${id}`);
    setEvents(events.filter(e => e.id !== id));
  };

  const handleToggle = async (event: AppEvent) => {
    const updated = await api.put(`/events/${event.id}`, { isCompleted: !event.isCompleted });
    setEvents(events.map(e => e.id === event.id ? updated.data : e));
  };

  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const activeEvents = sortedEvents.filter(e => !e.isCompleted);
  const doneEvents = sortedEvents.filter(e => e.isCompleted);

  return (
    <div className="animate-in max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">事件管理</h2>
          <p className="text-sm text-gray-400 mt-1">考试、提醒、校园跑...</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-all shadow-sm shadow-blue-200"
        >
          <Plus size={16} /> 新建
        </button>
      </div>

      {/* 新建表单 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-3">
          <input
            type="text" placeholder="事件标题" value={title} required
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={date} required onChange={e => setDate(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select value={type} onChange={e => setType(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
              {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={duration} onChange={e => setDuration(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
              <option value="30">30分钟</option><option value="60">1小时</option><option value="90">1.5小时</option><option value="120">2小时</option>
            </select>
            <input type="text" placeholder="备注" value={description}
              onChange={e => setDescription(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">取消</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors">
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500" />
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <CalendarClock size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">还没有事件</p>
          <p className="text-sm text-gray-400 mt-1">点击「新建」添加考试、提醒等</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 进行中 */}
          {activeEvents.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">进行中 · {activeEvents.length}</h3>
              <div className="space-y-1.5">
                {activeEvents.map(e => {
                  const isPast = new Date(e.date) < new Date(new Date().toDateString());
                  return (
                    <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow">
                      <button onClick={() => handleToggle(e)}
                        className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0 hover:border-green-400 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800">{e.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                          <span>{new Date(e.date).toLocaleDateString('zh-CN')}</span>
                          {e.time && <span>{e.time}</span>}
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 text-[10px]">{EVENT_TYPE_LABELS[e.type]}</span>
                          {e.description && <span className="truncate">{e.description}</span>}
                        </div>
                      </div>
                      {isPast && <span className="text-[10px] text-red-400 bg-red-50 px-1.5 py-0.5 rounded flex-shrink-0">已过期</span>}
                      <button onClick={() => handleDelete(e.id)}
                        className="text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 已完成 */}
          {doneEvents.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">已完成 · {doneEvents.length}</h3>
              <div className="space-y-1.5 opacity-50">
                {doneEvents.map(e => (
                  <div key={e.id} className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm line-through text-gray-400">{e.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{new Date(e.date).toLocaleDateString('zh-CN')}</div>
                    </div>
                    <button onClick={() => handleDelete(e.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
