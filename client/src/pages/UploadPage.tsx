import { useState, useRef } from 'react';
import api from '../services/api';
import { useData } from '../context/DataContext';
import type { Course } from '../types';
import { Upload, Camera, Trash2, FileText, Plus, X } from 'lucide-react';

export default function UploadPage() {
  const { courses: allCourses, refreshCourses } = useData();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [showManual, setShowManual] = useState(false);
  const [mName, setMName] = useState('');
  const [mTeacher, setMTeacher] = useState('');
  const [mLocation, setMLocation] = useState('');
  const [mDay, setMDay] = useState('1');
  const [mStart, setMStart] = useState('1');
  const [mEnd, setMEnd] = useState('2');
  const [mWeeks, setMWeeks] = useState('1-16周');

  const handleFile = async (file: File) => {
    setError(''); setMessage(''); setLoading(true); setPreview('');
    if (file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onloadend = () => setPreview(r.result as string);
      r.readAsDataURL(file);
    }
    const fd = new FormData(); fd.append('image', file);
    try { const res = await api.post('/courses/upload', fd); setCourses(res.data.courses); setMessage(res.data.message); refreshCourses(); }
    catch (err: any) { setError(err.response?.data?.message || '识别失败'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => { await api.delete(`/courses/${id}`); setCourses(cs => cs.filter(c => c.id !== id)); refreshCourses(); };
  const clearAll = async () => { await Promise.all(allCourses.map(c => api.delete(`/courses/${c.id}`))); setCourses([]); setMessage(''); refreshCourses(); };

  const handleManualAdd = async () => {
    if (!mName.trim()) return;
    try {
      await api.post('/courses', { name: mName.trim(), teacher: mTeacher.trim() || undefined, location: mLocation.trim() || undefined, weeks: mWeeks.trim(), dayOfWeek: Number(mDay), startSection: Number(mStart), endSection: Number(mEnd) });
      refreshCourses(); setMName(''); setMTeacher(''); setMLocation(''); setMWeeks('1-16周'); setShowManual(false); setMessage('已添加'); setTimeout(() => setMessage(''), 2000);
    } catch (err: any) { setError(err.response?.data?.message || '添加失败'); }
  };

  const grouped: Record<string, Course[]> = {};
  allCourses.forEach(c => { if (!grouped[c.name]) grouped[c.name] = []; grouped[c.name].push(c); });

  return (
    <div className="animate-in max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-800">上传课表</h2><p className="text-sm text-gray-400 mt-1">支持图片和 PDF，AI 自动识别</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowManual(!showManual)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100"><Plus size={14} /> 手动添加</button>
          {allCourses.length > 0 && <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5">清除全部</button>}
        </div>
      </div>

      {showManual && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-gray-700 text-sm">手动添加课程</h3><button onClick={() => setShowManual(false)} className="text-gray-300 hover:text-gray-500"><X size={16} /></button></div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <input type="text" placeholder="课程名" value={mName} onChange={e => setMName(e.target.value)} className="col-span-4 px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20" />
            <input type="text" placeholder="教师" value={mTeacher} onChange={e => setMTeacher(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20" />
            <input type="text" placeholder="教室" value={mLocation} onChange={e => setMLocation(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20" />
            <select value={mDay} onChange={e => setMDay(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none bg-white">{['周一','周二','周三','周四','周五','周六','周日'].map((d,i) => <option key={i} value={i+1}>{d}</option>)}</select>
            <input type="text" placeholder="周次" value={mWeeks} onChange={e => setMWeeks(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">节次:</span><input type="number" min="1" max="12" value={mStart} onChange={e => setMStart(e.target.value)} className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center outline-none" />
            <span className="text-xs text-gray-400">-</span><input type="number" min="1" max="12" value={mEnd} onChange={e => setMEnd(e.target.value)} className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center outline-none" /><span className="text-xs text-gray-400">节</span>
            <button onClick={handleManualAdd} className="ml-auto px-4 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600">添加</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all" onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}>
          {preview ? <img src={preview} alt="预览" className="max-h-56 mx-auto rounded-xl shadow-md" /> : <div className="text-gray-400"><div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><Camera className="text-blue-400" size={28} /></div><p className="text-base font-medium text-gray-500">点击或拖拽课表到这里</p><p className="text-sm mt-1">JPG · PNG · WebP · PDF</p></div>}
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
        {loading && <div className="text-center py-4"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500 mx-auto" /><p className="text-sm text-gray-500 mt-2">AI 正在识别...</p></div>}
        {error && <div className="mt-3 bg-red-50 text-red-600 p-3 rounded-xl text-xs">{error}</div>}
        {message && <div className="mt-3 bg-green-50 text-green-600 p-3 rounded-xl text-xs">{message}</div>}
      </div>

      {allCourses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3"><FileText size={16} className="text-blue-500" /><h3 className="font-semibold text-gray-700 text-sm">全部课程 ({Object.keys(grouped).length})</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs"><thead><tr className="border-b text-left text-gray-400 uppercase tracking-wider"><th className="pb-2 font-medium">课程</th><th className="pb-2 font-medium">教师</th><th className="pb-2 font-medium">教室</th><th className="pb-2 font-medium">周次</th><th className="pb-2 font-medium">时间</th><th className="pb-2 font-medium w-8"></th></tr></thead>
              <tbody>{Object.entries(grouped).map(([name, items]) => { const base = items[0]; const times = items.map(c => `周${'日一二三四五六'[c.dayOfWeek]} ${c.startSection}-${c.endSection}节`).join(' '); const rooms = [...new Set(items.map(c => c.location || '').filter(Boolean))].join('/') || '-'; return (<tr key={base.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors"><td className="py-2 font-medium text-gray-800">{name}</td><td className="py-2 text-gray-500">{base.teacher || '-'}</td><td className="py-2 text-gray-500">{rooms}</td><td className="py-2 text-gray-500">{items[0].weeks || '-'}</td><td className="py-2 text-gray-600">{times}</td><td className="py-2">{items.map(c => <button key={c.id} onClick={() => handleDelete(c.id)} className="text-gray-300 hover:text-red-500 block mx-auto"><Trash2 size={13} /></button>)}</td></tr>); })}</tbody></table>
          </div>
        </div>
      )}
    </div>
  );
}
