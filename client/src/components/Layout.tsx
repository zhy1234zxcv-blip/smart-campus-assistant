import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, Upload, ListTodo, Home, GraduationCap, Settings } from 'lucide-react';

const links = [
  { to: '/', icon: Home, label: '首页', end: true },
  { to: '/upload', icon: Upload, label: '上传课表' },
  { to: '/calendar', icon: Calendar, label: '日历视图' },
  { to: '/events', icon: ListTodo, label: '事件管理' },
];

export default function Layout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200 scale-[1.02]'
        : 'text-slate-500 hover:bg-white/60 hover:text-slate-700 hover:shadow-sm'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* 顶栏 */}
      <header className="sticky top-0 z-20 border-b border-white/50 header-blur" style={{ backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <GraduationCap size={17} className="text-white" />
          </div>
          <h1 className="text-[15px] font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">校园课表助手</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* 侧边栏 */}
        <nav className="w-52 min-h-[calc(100vh-56px)] p-3 flex flex-col gap-1 sidebar-blur" style={{ backdropFilter: 'blur(12px)' }}>
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          <div className="mt-auto pt-2 border-t border-slate-200/50">
            <NavLink to="/settings" className={linkClass}>
              <Settings size={16} />
              设置
            </NavLink>
          </div>
        </nav>

        {/* 主内容 */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
