import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
}

export interface CourseData {
  name: string;
  teacher?: string;
  location?: string;
  weeks: string;
  dayOfWeek: number;
  startSection: number;
  endSection: number;
  type?: string;
  classId?: string;
}

export interface CreateEventInput {
  title: string;
  date: string;
  time?: string;
  type: 'exam' | 'reminder' | 'campus_run' | 'other';
  description?: string;
}
