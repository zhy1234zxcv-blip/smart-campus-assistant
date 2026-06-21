/*
 * 日历工具
 * - coursesToCalendarEvents: 把课程转为 react-big-calendar 事件（按周次展开）
 * - 学期始：2026/2/23（周一），节次→时间映射
 * - eventsToCalendarEvents: 用户事件转为日历事件
 */
import type { CalendarEvent, Course, AppEvent } from '../types';

// 节次 → 时间映射
const SECTION_TIMES: Record<number, { h: number; m: number }> = {
  1: { h: 8, m: 0 },  2: { h: 8, m: 50 },
  3: { h: 9, m: 50 }, 4: { h: 10, m: 40 },
  5: { h: 11, m: 30 }, 6: { h: 14, m: 0 },
  7: { h: 14, m: 50 }, 8: { h: 15, m: 50 },
  9: { h: 16, m: 40 }, 10: { h: 18, m: 30 },
  11: { h: 19, m: 20 }, 12: { h: 20, m: 10 }
};

// 解析周次字符串
function parseWeeks(weeksStr: string): number[] {
  const weeks: number[] = [];
  const ranges = weeksStr.split(',');
  ranges.forEach(range => {
    const nums = range.match(/\d+/g)?.map(Number) || [];
    if (range.includes('-') && nums.length >= 2) {
      for (let i = nums[0]; i <= nums[1]; i++) weeks.push(i);
    } else if (nums.length > 0) {
      weeks.push(nums[0]);
    }
  });
  return weeks;
}

// 获取学期开始日期（假设 2026年春季学期 2月23日开学，周一）
const SEMESTER_START = new Date(2026, 1, 23);

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getTime(section: number): { h: number; m: number } {
  return SECTION_TIMES[section] || { h: 8, m: 0 };
}

// 课程 → 日历事件
export function coursesToCalendarEvents(courses: Course[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  courses.forEach(course => {
    const weeks = parseWeeks(course.weeks);
    weeks.forEach(week => {
      const weekStart = addDays(SEMESTER_START, (week - 1) * 7);
      const dayDate = addDays(weekStart, course.dayOfWeek - 1);
      const startTime = getTime(course.startSection);
      const endTime = getTime(course.endSection);

      const start = new Date(dayDate);
      start.setHours(startTime.h, startTime.m, 0);
      const end = new Date(dayDate);
      end.setHours(endTime.h, endTime.m + 50, 0); // 每节课50分钟

      events.push({
        id: `course-${course.id}-w${week}`,
        title: course.name,
        start,
        end,
        type: 'course',
        description: `${course.teacher || ''} | ${course.location || ''}`
      });
    });
  });
  return events;
}

// 事件 → 日历事件
export function eventsToCalendarEvents(events: AppEvent[]): CalendarEvent[] {
  return events.map(event => {
    const start = event.time
      ? new Date(`${event.date.split('T')[0]}T${event.time}`)
      : new Date(event.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
      id: `event-${event.id}`,
      title: event.title,
      start,
      end,
      type: event.type,
      description: event.description || ''
    };
  });
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  exam: '考试',
  reminder: '提醒',
  campus_run: '校园跑',
  other: '其他'
};

export const DAY_LABELS = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
