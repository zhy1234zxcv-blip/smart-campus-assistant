import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import courseRoutes from './routes/courses';
import eventRoutes from './routes/events';
import prisma from './db';
import { setupNotificationCron } from './services/notificationService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 【单用户模式】启动时确保默认用户存在，无需注册登录
async function ensureDefaultUser() {
  const user = await prisma.user.findFirst();
  if (!user) {
    await prisma.user.create({
      data: { email: 'default@local', passwordHash: '', name: 'Default' }
    });
    console.log('默认用户已创建');
  }
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 路由（无认证）
app.use('/api/courses', courseRoutes);
app.use('/api/events', eventRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: '服务器错误' });
});

ensureDefaultUser().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器启动: http://localhost:${PORT}`);
    setupNotificationCron();
  });
});

export default app;
