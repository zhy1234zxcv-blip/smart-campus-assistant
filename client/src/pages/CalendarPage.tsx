/*
 * 日历页面（最复杂页面）
 * 三视图：
 *   月视图 - 自定义网格，显示课程数/上课天数/节假日，点击日期→日视图
 *   周视图 - react-big-calendar，8:00-20:00，已过课程灰色背景
 *   日视图 - 今天=天气侧栏+课程表+时间线；其他天=仅课程表
 * 功能：
 *   天气条（4天，可点击跳转）| 课程弹窗（点击事件/课程列表）
 *   学期周导航（第1-18周）| 节假日标注（2026法定假日）
 *   月翻页 / 全数字日期 / 中文星期
 */
import { useEffect, useState, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/zh-cn';
import api from '../services/api';
import type { Course, AppEvent, CalendarEvent } from '../types';
import { coursesToCalendarEvents, eventsToCalendarEvents } from '../utils/calendarUtils';
import { BookOpen, CalendarDays, Umbrella, CloudRain, X, MapPin, User, Clock, GraduationCap } from 'lucide-react';
import { fetchWeather, type WeatherData, type DailyWeather, type HourlyWeather } from '../services/weather';

moment.locale('zh-cn');
const localizer = momentLocalizer(moment);
const SEMESTER_START = new Date(2026, 2, 2);  // 宁工 2026 春季学期：3月2日开学

// 2026 春季学期节假日
const HOLIDAYS: { start: string; end: string; name: string }[] = [
  { start: '2026-04-04', end: '2026-04-06', name: '清明节' },
  { start: '2026-05-01', end: '2026-05-05', name: '劳动节' },
  { start: '2026-06-19', end: '2026-06-21', name: '端午节' }
];
// 补班日
const MAKEUP_DAYS = new Set(['2026-05-09']);

const EVENT_COLORS: Record<string, string> = {
  course: '#3b82f6', exam: '#ef4444', reminder: '#f59e0b', campus_run: '#10b981', other: '#6b7280'
};

function isHoliday(date: Date): string | null {
  const s = moment(date).format('YYYY-MM-DD');
  for (const h of HOLIDAYS) {
    if (s >= h.start && s <= h.end) return h.name;
  }
  return null;
}

function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

// 自定义月份网格
function MonthGrid({ date, calendarEvents, onNavigate, onDayClick }: { date: Date; calendarEvents: CalendarEvent[]; onNavigate: (d: Date) => void; onDayClick: (d: Date) => void }) {
  const start = moment(date).startOf('month').startOf('week');
  const end = moment(date).endOf('month').endOf('week');
  const today = moment().format('YYYY-MM-DD');

  // 按天分组事件
  const dayMap = new Map<string, Set<string>>();
  calendarEvents.forEach(e => {
    const key = moment(e.start).format('YYYY-MM-DD');
    if (!dayMap.has(key)) dayMap.set(key, new Set());
    dayMap.get(key)!.add(e.title);
  });

  // 统计
  const monthStart = moment(date).format('YYYY-MM');
  let totalCourses = 0, schoolDays = 0, holidayDays = 0;
  const courseSet = new Set<string>();
  calendarEvents.forEach(e => {
    if (moment(e.start).format('YYYY-MM') === monthStart && e.type === 'course') {
      courseSet.add(e.title);
    }
  });
  totalCourses = courseSet.size;

  const days: { date: Date; courses: number; holiday: string | null; isCurrentMonth: boolean; isToday: boolean; isWeekend: boolean; isMakeup: boolean }[] = [];
  const cursor = moment(start);
  while (cursor.isSameOrBefore(end)) {
    const d = cursor.toDate();
    const ds = cursor.format('YYYY-MM-DD');
    const monthMatch = cursor.format('YYYY-MM') === monthStart;
    const holiday = isHoliday(d);
    const makeup = MAKEUP_DAYS.has(ds);
    const dayCourses = dayMap.get(ds)?.size || 0;

    if (monthMatch) {
      if (holiday) holidayDays++;
      else if (isWeekend(d)) { /* weekend, not counted */ }
      else if (makeup || dayCourses > 0) schoolDays++;
    }

    days.push({
      date: new Date(d), courses: dayCourses,
      holiday, isCurrentMonth: monthMatch,
      isToday: ds === today, isWeekend: isWeekend(d) || false, isMakeup: makeup
    });
    cursor.add(1, 'day');
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div>
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <BookOpen size={20} className="mx-auto mb-1 text-blue-500" />
          <div className="text-2xl font-bold text-gray-800">{totalCourses}</div>
          <div className="text-xs text-gray-400">门课程</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <CalendarDays size={20} className="mx-auto mb-1 text-green-500" />
          <div className="text-2xl font-bold text-gray-800">{schoolDays}</div>
          <div className="text-xs text-gray-400">天上课</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <Umbrella size={20} className="mx-auto mb-1 text-orange-500" />
          <div className="text-2xl font-bold text-gray-800">{holidayDays}</div>
          <div className="text-xs text-gray-400">天假期</div>
        </div>
      </div>

      {/* 月份标题 + 导航 */}
      <div className="flex items-center justify-center gap-4 mb-3">
        <button onClick={() => onNavigate(moment(date).subtract(1, 'month').toDate())}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors text-lg">‹</button>
        <span className="text-lg font-bold text-gray-700 w-32 text-center">{moment(date).format('YYYY年M月')}</span>
        <button onClick={() => onNavigate(moment(date).add(1, 'month').toDate())}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors text-lg">›</button>
      </div>

      {/* 日历网格 */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekDays.map(w => (
            <div key={w} className="py-2 text-center text-xs font-semibold text-gray-400">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            let bg = 'bg-white';
            let text = d.isCurrentMonth ? 'text-gray-700' : 'text-gray-300';
            let badge = null;
            const isPastDay = moment(d.date).isBefore(moment(), 'day');

            if (isPastDay && d.isCurrentMonth) {
              bg = 'bg-gray-100'; text = 'text-gray-400';
              if (d.courses > 0) badge = <span className="text-[10px] text-gray-400 mt-0.5">{d.courses}门课</span>;
            } else if (d.holiday) {
              bg = 'bg-orange-50'; text = 'text-orange-600';
              badge = <span className="text-[9px] text-orange-500 mt-0.5">{d.holiday}</span>;
            } else if (d.isMakeup) {
              bg = 'bg-blue-50'; text = 'text-blue-600';
              badge = <span className="text-[9px] text-blue-500 mt-0.5">补班</span>;
            } else if (d.isWeekend && d.isCurrentMonth) {
              bg = 'bg-gray-50'; text = 'text-gray-400';
            } else if (d.courses > 0 && d.isCurrentMonth) {
              bg = 'bg-blue-50'; text = 'text-blue-700';
              badge = <span className="text-[10px] font-bold text-blue-600 mt-0.5">{d.courses}门课</span>;
            }

            return (
              <div
                key={i}
                onClick={() => d.isCurrentMonth && onDayClick(d.date)}
                className={`${bg} border-b border-r border-gray-50 p-1.5 min-h-[60px] flex flex-col items-center justify-center ${d.isCurrentMonth ? 'cursor-pointer hover:brightness-95' : ''} transition-all ${d.isToday ? 'ring-2 ring-blue-400 ring-inset' : ''}`}
                title={moment(d.date).format('M月D日') + (d.holiday ? ` ${d.holiday}` : '')}
              >
                <span className={`text-xs font-medium ${text}`}>{d.date.getDate()}</span>
                {badge}
              </div>
            );
          })}
        </div>
      </div>

      {/* 图例 */}
      <div className="flex gap-4 mt-3 text-xs text-gray-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-50 border border-blue-200" /> 有课</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-50 border border-orange-200" /> 假期</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-50 border border-blue-300" /> 补班</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-50 border border-gray-200" /> 周末</span>
      </div>
    </div>
  );
}

// 周/日视图事件组件（已过课程灰色背景 + 可点击弹窗）
function WeekEvent({ event, onCourseClick, courses }: { event: CalendarEvent; onCourseClick: (c: Course) => void; courses: Course[] }) {
  const isPast = event.end < new Date();
  const courseId = event.id.startsWith('course-') ? event.id.split('-')[1] : null;
  const course = courseId ? courses.find(c => c.id === courseId) : null;

  if (isPast) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); if (course) onCourseClick(course); }}
        className="text-[12px] p-1.5 rounded h-full cursor-pointer hover:brightness-95 transition-all bg-gray-200 border-l-4 border-gray-300 text-gray-400"
        title={course ? `${course.name}\n${course.teacher || ''}\n${course.location || ''}` : event.title}
      >
        <div className="font-semibold truncate line-through">{event.title}</div>
      </div>
    );
  }

  const color = EVENT_COLORS[event.type] || '#6b7280';
  return (
    <div
      onClick={(e) => { e.stopPropagation(); if (course) onCourseClick(course); }}
      className="text-[12px] p-1.5 rounded h-full cursor-pointer hover:brightness-90 transition-all"
      style={{ backgroundColor: color + '15', borderLeft: `3px solid ${color}`, color: '#1f2937' }}
      title={course ? `${course.name}\n${course.teacher || ''}\n${course.location || ''}` : event.title}
    >
      <div className="font-semibold truncate">{event.title}</div>
      {event.description && <div className="text-[10px] text-gray-800 truncate mt-0.5">{event.description}</div>}
    </div>
  );
}

// 当天课程列表（可点击弹窗，已过课程灰色背景）
function CourseDayList({ date, calendarEvents, courses, onCourseClick }: { date: Date; calendarEvents: CalendarEvent[]; courses: Course[]; onCourseClick: (c: Course) => void }) {
  const dateStr = moment(date).format('YYYY-MM-DD');
  const now = new Date();
  const dayCourses = calendarEvents
    .filter(e => moment(e.start).format('YYYY-MM-DD') === dateStr && e.type === 'course')
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // 去重
  const seen = new Set<string>();
  const unique = dayCourses.filter(e => {
    const key = e.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];

  if (unique.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 text-center text-sm text-gray-400">
        {moment(date).format('M/D')} {weekDay} · 无课
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={16} className="text-blue-500" />
        <span className="text-sm font-semibold text-gray-700">
          {moment(date).format('M/D')} {weekDay} · {unique.length} 门课
        </span>
      </div>
      <div className="space-y-1.5">
        {unique.map((ce, i) => {
          const isPast = ce.end < now;
          const courseId = ce.id.startsWith('course-') ? ce.id.split('-')[1] : null;
          const course = courseId ? courses.find(c => c.id === courseId) : null;
          return (
            <div key={i}
              onClick={() => { if (course) onCourseClick(course); }}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${isPast ? 'bg-gray-100 hover:bg-gray-200' : 'hover:bg-blue-50/50'}`}>
              <div className={`w-1 h-8 rounded-full flex-shrink-0 ${isPast ? 'bg-gray-300' : 'bg-blue-400'}`} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isPast ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{ce.title}</div>
                {ce.description && <div className="text-xs text-gray-700 truncate">{ce.description}</div>}
              </div>
              <div className={`text-xs flex-shrink-0 ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>
                {moment(ce.start).format('HH:mm')}-{moment(ce.end).format('HH:mm')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/courses').then(r => setCourses(r.data)),
      api.get('/events').then(r => setEvents(r.data)),
      fetchWeather().then(setWeather).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return [...coursesToCalendarEvents(courses), ...eventsToCalendarEvents(events)];
  }, [courses, events]);

  const handleCourseClick = (c: Course) => setSelectedCourse(c);

  const components = useMemo(() => ({
    week: { event: (props: any) => <WeekEvent {...props} onCourseClick={handleCourseClick} courses={courses} /> },
    day: { event: (props: any) => <WeekEvent {...props} onCourseClick={handleCourseClick} courses={courses} /> }
  }), [courses]);

  const semesterWeeks = useMemo(() => {
    const weeks: { label: string; date: Date }[] = [];
    for (let w = 1; w <= 18; w++) {
      const d = new Date(SEMESTER_START);
      d.setDate(d.getDate() + (w - 1) * 7);
      weeks.push({ label: `第${w}周`, date: d });
    }
    return weeks;
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;
  }

  const isMonthView = view === Views.MONTH;

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">日历视图</h2>
          <p className="text-sm text-gray-400 mt-1">{courses.length} 门课程 · {calendarEvents.length} 个日程</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={() => setDate(SEMESTER_START)} className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">学期初</button>
          <button onClick={() => setDate(new Date())} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">今天</button>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['month', 'week', 'day'] as const).map(v => (
              <button key={v} onClick={() => setView(v === 'month' ? Views.MONTH : v === 'week' ? Views.WEEK : Views.DAY)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${view === (v === 'month' ? Views.MONTH : v === 'week' ? Views.WEEK : Views.DAY) ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>
                {{ month: '月', week: '周', day: '日' }[v]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {calendarEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-lg text-gray-500 mb-1">暂无课表数据</p>
          <p className="text-sm text-gray-400">先上传课表，课程会自动显示在日历中</p>
        </div>
      ) : isMonthView ? (
        <MonthGrid date={date} calendarEvents={calendarEvents} onNavigate={setDate} onDayClick={(d) => { setDate(d); setView(Views.DAY); }} />
      ) : (
        <>
          {/* 日视图 + 周视图：天气小条（4天，可点击） */}
          {weather && (view === Views.DAY || view === Views.WEEK) && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {weather.daily.slice(0, 4).map((d: DailyWeather, i: number) => {
                const weekDay = moment(d.date).format('ddd');
                const label = i === 0 ? '昨天' : i === 1 ? '今天' : i === 2 ? '明天' : '后天';
                return (
                  <div key={d.date}
                    onClick={() => { setDate(moment(d.date).toDate()); setView(Views.DAY); }}
                    className="bg-white rounded-xl border border-gray-100 p-2.5 text-center cursor-pointer hover:shadow-sm transition-shadow">
                    <div className="text-[10px] text-gray-400">{label}</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">{weekDay} {d.date.slice(5)}</div>
                    <div className="text-xl my-1">{d.icon}</div>
                    <div className="text-xs font-bold text-gray-700">{d.minTemp}°~{d.maxTemp}°</div>
                    {d.rainProb > 0 && (
                      <div className="text-[10px] text-blue-500 mt-0.5 flex items-center justify-center gap-0.5">
                        <CloudRain size={10} /> {d.rainProb}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 日视图：仅今天显示逐时天气 + 课程并排 */}
          {view === Views.DAY && moment(date).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD') && weather && (
            <div className="flex gap-4 mb-4">
              <div className="w-28 flex-shrink-0 bg-white rounded-xl border border-gray-100 p-3">
                <div className="text-center mb-2">
                  <div className="text-[10px] text-gray-400">{weather.location}</div>
                  <div className="text-2xl mt-1">{weather.daily[1]?.icon}</div>
                  <div className="text-[10px] text-gray-500">{weather.daily[1]?.label}</div>
                  <div className="text-sm font-bold text-gray-700">{weather.daily[1]?.minTemp}°~{weather.daily[1]?.maxTemp}°</div>
                </div>
                <div className="space-y-1.5">
                  {weather.hourly
                    .filter((h: HourlyWeather) => h.time.startsWith(moment().format('YYYY-MM-DD')))
                    .filter((_: any, i: number) => i % 3 === 0)
                    .map((h: HourlyWeather) => (
                      <div key={h.time} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                        <span className="text-gray-400 w-8">{h.time.slice(11, 16)}</span>
                        <span className="text-sm">{h.icon}</span>
                        <span className="font-medium text-gray-700 w-7 text-right">{h.temp}°</span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="flex-1">
                <CourseDayList date={date} calendarEvents={calendarEvents} courses={courses} onCourseClick={handleCourseClick} />
              </div>
            </div>
          )}

          {/* 日视图：非今天仅课程（全宽） */}
          {view === Views.DAY && moment(date).format('YYYY-MM-DD') !== moment().format('YYYY-MM-DD') && (
            <CourseDayList date={date} calendarEvents={calendarEvents} courses={courses} onCourseClick={handleCourseClick} />
          )}

          <div className="bg-white rounded-xl border border-gray-100 p-2 mb-4 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {semesterWeeks.map(({ label, date: weekDate }) => (
                <button key={label} onClick={() => { setDate(weekDate); setView(Views.WEEK); }}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
                    Math.abs(weekDate.getTime() - date.getTime()) < 7 * 24 * 3600 * 1000 ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ height: 550 }}>
            <Calendar
              localizer={localizer} events={calendarEvents as any}
              startAccessor="start" endAccessor="end"
              view={view} date={date} onView={setView} onNavigate={(d) => setDate(d)}
              components={components as any}
              min={new Date(2026, 0, 1, 8, 0, 0)}
              max={new Date(2026, 0, 1, 20, 50, 0)}  // 第十二节下课
              popup views={[Views.WEEK, Views.DAY]}
              step={60}
              timeslots={1}
              onDrillDown={(d: Date) => { setDate(d); setView(Views.DAY); }}
              formats={{
                weekdayFormat: (date: Date, culture: any, localizer: any) => localizer.format(date, 'dd'),
                monthHeaderFormat: 'YYYY/M',
                dayHeaderFormat: (date: Date) => {
                  const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
                  return `${date.getMonth() + 1}/${date.getDate()} 周${weekDay}`;
                },
                dayRangeHeaderFormat: ({ start, end }: any) =>
                  `${moment(start).format('M/D')} - ${moment(end).format('M/D')}`,
                agendaHeaderFormat: ({ start, end }: any) =>
                  `${moment(start).format('M/D')} - ${moment(end).format('M/D')}`,
                timeGutterFormat: 'HH:mm'
              }}
              messages={{ today: '今天', previous: '‹', next: '›', month: '月', week: '周', day: '日', date: '日期', time: '时间', event: '事件', noEventsInRange: '无日程', showMore: (t: number) => `+${t} 更多` }}
            />
          </div>
        </>
      )}

      {/* 课程详情弹窗 */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setSelectedCourse(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm m-4 animate-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <GraduationCap size={16} className="text-blue-500" />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">{selectedCourse.name}</h3>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="text-gray-300 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {selectedCourse.teacher && (
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">{selectedCourse.teacher}</span>
                </div>
              )}
              {selectedCourse.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">{selectedCourse.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">
                  周{selectedCourse.dayOfWeek} {selectedCourse.startSection}-{selectedCourse.endSection}节
                </span>
              </div>
              {selectedCourse.weeks && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">{selectedCourse.weeks}</span>
                </div>
              )}
              {selectedCourse.type && (
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">{selectedCourse.type}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
