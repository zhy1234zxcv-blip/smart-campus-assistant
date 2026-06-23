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
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* 顶栏 */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">校园课表助手</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* 侧边栏 */}
        <nav className="w-52 min-h-[calc(100vh-56px)] bg-white/60 backdrop-blur border-r border-gray-100 p-3 flex flex-col gap-1">
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <div className="mt-auto pt-2 border-t border-gray-100">
            <NavLink to="/settings" className={linkClass}>
              <Settings size={18} />
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
