import { useState, useRef } from 'react';
import api from '../services/api';
import { useData } from '../context/DataContext';
import type { Course } from '../types';
import { Upload, Camera, Trash2, FileText } from 'lucide-react';

export default function UploadPage() {
  const { courses: allCourses, refreshCourses } = useData();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    setMessage('');
    setLoading(true);
    setPreview('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/courses/upload', formData);
      setCourses(res.data.courses);
      setMessage(res.data.message);
      refreshCourses();
    } catch (err: any) {
      setError(err.response?.data?.message || '识别失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/courses/${id}`);
    setCourses(courses.filter(c => c.id !== id));
    setAllCourses(allCourses.filter(c => c.id !== id));
  };

  const clearAll = async () => {
    await Promise.all(allCourses.map(c => api.delete(`/courses/${c.id}`)));
    setAllCourses([]);
    setCourses([]);
    setMessage('');
  };

  return (
    <div className="animate-in max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">上传课表</h2>
          <p className="text-sm text-gray-400 mt-1">支持图片和 PDF，AI 自动识别</p>
        </div>
        {allCourses.length > 0 && (
          <button onClick={clearAll} className="text-sm text-red-400 hover:text-red-600 transition-colors">
            清除全部
          </button>
        )}
      </div>

      {/* 上传区域 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div
          className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          {preview ? (
            <img src={preview} alt="预览" className="max-h-56 mx-auto rounded-xl shadow-md" />
          ) : (
            <div className="text-gray-400">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Camera className="text-blue-400" size={28} />
              </div>
              <p className="text-base font-medium text-gray-500">点击或拖拽课表到这里</p>
              <p className="text-sm mt-1">JPG · PNG · WebP · PDF</p>
            </div>
          )}
          <input
            ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {loading && (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500 mx-auto" />
            <p className="text-sm text-gray-500 mt-3">AI 正在识别课表，请稍候...</p>
          </div>
        )}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm">{error}</div>
        )}
        {message && (
          <div className="mt-4 bg-green-50 border border-green-100 text-green-600 p-3 rounded-xl text-sm">{message}</div>
        )}
      </div>

      {/* 课程列表 */}
      {allCourses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-blue-500" />
            <h3 className="font-semibold text-gray-700">全部课程 ({allCourses.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-2 font-medium">课程</th>
                  <th className="pb-2 font-medium">教师</th>
                  <th className="pb-2 font-medium">教室</th>
                  <th className="pb-2 font-medium">周次</th>
                  <th className="pb-2 font-medium">时间</th>
                  <th className="pb-2 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // 按课程名分组
                  const grouped: Record<string, Course[]> = {};
                  allCourses.forEach(c => {
                    if (!grouped[c.name]) grouped[c.name] = [];
                    grouped[c.name].push(c);
                  });
                  return Object.entries(grouped).map(([name, items]) => {
                    const base = items[0];
                    // 收集所有时间段
                    const times = items.map(c => {
                      const weekDay = ['日','一','二','三','四','五','六'][c.dayOfWeek];
                      return `周${weekDay} ${c.startSection}-${c.endSection}节`;
                    }).join(' ');
                    // 收集所有教室（去重）
                    const rooms = [...new Set(items.map(c => c.location || '').filter(Boolean))].join('/') || '-';
                    const allWeeks = [...new Set(items.map(c => c.weeks || '').filter(Boolean))].join('; ') || '-';
                    return (
                      <tr key={base.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                        <td className="py-2.5 font-medium text-gray-800">{name}</td>
                        <td className="py-2.5 text-gray-500">{base.teacher || '-'}</td>
                        <td className="py-2.5 text-gray-500 text-xs">{rooms}</td>
                        <td className="py-2.5 text-gray-500 text-xs">{allWeeks.length > 60 ? allWeeks.slice(0,60)+'...' : allWeeks}</td>
                        <td className="py-2.5 text-gray-600 text-xs">{times}</td>
                        <td className="py-2.5">
                          {items.map(c => (
                            <button key={c.id} onClick={() => handleDelete(c.id)} className="text-gray-300 hover:text-red-500 transition-colors block mx-auto">
                              <Trash2 size={15} />
                            </button>
                          ))}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
