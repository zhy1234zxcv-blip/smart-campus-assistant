import cron from 'node-cron';
import prisma from '../db';

export const setupNotificationCron = (): void => {
  // 每天凌晨1点执行
  cron.schedule('0 1 * * *', async () => {
    console.log('开始执行每日提醒检查...');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const upcomingEvents = await prisma.event.findMany({
        where: {
          date: {
            gte: tomorrow,
            lt: dayAfter
          }
        },
        include: { user: true }
      });

      upcomingEvents.forEach(event => {
        console.log(`提醒用户 ${event.user.email}: 明天有 ${event.title}`);
        // 这里可以接入微信通知等推送渠道
      });

      console.log(`完成每日提醒检查，找到 ${upcomingEvents.length} 个明日事件`);
    } catch (error) {
      console.error('每日提醒执行失败:', error);
    }
  });

  console.log('每日提醒定时任务已启动 (每天 01:00)');
};
