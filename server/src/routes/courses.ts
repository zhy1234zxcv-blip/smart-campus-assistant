import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { attachUser } from '../middleware/attachUser';
import { upload, uploadSchedule, addCourse, getCourses, deleteCourse } from '../controllers/courseController';

const router = Router();

// multer 错误处理包装
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({ message: '文件上传失败：仅支持 JPG、PNG、WebP、PDF 格式，大小不超过 10MB' });
      return;
    }
    if (err) {
      res.status(400).json({ message: err.message || '上传失败' });
      return;
    }
    next();
  });
};

router.use(attachUser as any);
router.post('/upload', handleUpload as any, uploadSchedule as any);
router.post('/', addCourse as any);
router.get('/', getCourses as any);
router.delete('/:id', deleteCourse as any);

export default router;
