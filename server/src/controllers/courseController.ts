/*
 * 课程控制器
 * - 图片上传走 qwen-vl-max 视觉识别
 * - PDF 上传走 PyMuPDF(350 DPI) 转图片 → qwen-vl-max 识别
 * - 上传新课时自动清除旧课表 + 去重
 */
import { Response } from 'express';
import { AuthRequest, CourseData } from '../types';
import { parseScheduleImage } from '../services/ocrService';
import { pdfToImages } from '../services/pdfExtractor';
import prisma from '../db';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'image'));
    }
  }
});

export const uploadSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: '请上传课表图片或PDF' });
      return;
    }

    let courses: CourseData[];

    if (req.file.mimetype === 'application/pdf') {
      // PDF: 350 DPI 高清晰度图片 → 视觉模型识别
      const images = pdfToImages(req.file.path);
      if (images.length === 0) {
        res.status(400).json({ message: 'PDF 转换失败，请重试' });
        return;
      }
      const allCourses: CourseData[] = [];
      for (const img of images) {
        const pageCourses = await parseScheduleImage(img);
        allCourses.push(...pageCourses);
      }
      courses = allCourses;
    } else {
      // 图片: 用视觉模型识别
      const imageBuffer = fs.readFileSync(req.file.path);
      const imageBase64 = imageBuffer.toString('base64');
      courses = await parseScheduleImage(imageBase64);
    }

    // 清除旧课表
    await prisma.course.deleteMany({ where: { userId: req.userId! } });

    // 去重（同一时间段的课只保留一条）
    const seen = new Set<string>();
    const uniqueCourses = courses.filter(c => {
      const key = `${c.name}-${c.dayOfWeek}-${c.startSection}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const savedCourses = await Promise.all(
      uniqueCourses.map(course =>
        prisma.course.create({
          data: {
            userId: req.userId!,
            name: course.name,
            teacher: course.teacher,
            location: course.location,
            classId: course.classId,
            weeks: course.weeks,
            dayOfWeek: course.dayOfWeek,
            startSection: course.startSection,
            endSection: course.endSection,
            type: course.type
          }
        })
      )
    );

    fs.unlinkSync(req.file.path);

    res.json({ message: `识别成功，共 ${savedCourses.length} 门课程`, courses: savedCourses });
  } catch (error: any) {
    console.error('课表识别失败:', error.message);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (error.code === 'P2002') {
      res.status(409).json({ message: '课程已存在，请先清除后重试' });
      return;
    }
    res.status(500).json({ message: error.message?.includes('JSON') ? 'AI解析异常，请重试' : (error.message || '识别失败，请重试') });
  }
};

export const addCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courseData: CourseData = req.body;
    const course = await prisma.course.create({
      data: {
        userId: req.userId!,
        name: courseData.name,
        teacher: courseData.teacher,
        location: courseData.location,
        classId: courseData.classId,
        weeks: courseData.weeks,
        dayOfWeek: courseData.dayOfWeek,
        startSection: courseData.startSection,
        endSection: courseData.endSection,
        type: courseData.type
      }
    });
    res.status(201).json(course);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ message: '该时段已有课程' });
      return;
    }
    res.status(500).json({ message: '添加课程失败' });
  }
};

export const getCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courses = await prisma.course.findMany({
      where: { userId: req.userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startSection: 'asc' }]
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: '获取课程失败' });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await prisma.course.findFirst({
      where: { id: req.params.id, userId: req.userId }
    });
    if (!course) {
      res.status(404).json({ message: '课程不存在' });
      return;
    }
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ message: '课程已删除' });
  } catch (error) {
    res.status(500).json({ message: '删除课程失败' });
  }
};
