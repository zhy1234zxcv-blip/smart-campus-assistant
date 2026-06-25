export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Course {
  id: string;
  userId: string;
  name: string;
  teacher?: string;
  location?: string;
  classId?: string;
  weeks: string;
  dayOfWeek: number;
  startSection: number;
  endSection: number;
  type?: string;
}

export interface AppEvent {
  id: string;
  userId: string;
  title: string;
  date: string;
  time?: string;
  type: 'exam' | 'reminder' | 'campus_run' | 'other';
  description?: string;
  isCompleted: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  description?: string;
  eventId?: string;
}
