/*
 * AI 每日建议服务
 * 根据当天课程、事件和天气生成个性化提醒
 * 每天刷新一次（缓存到当天结束）
 */
import axios from 'axios';
import prisma from '../db';

interface Suggestion {
  tips: string[];
  updatedAt: string;
}

// 内存缓存
let cache: { data: Suggestion; date: string; key: string } | null = null;

function getCacheKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailySuggestion(apiKey?: string, model?: string, customPrompt?: string): Promise<Suggestion> {
  // 必须由客户端提供 API Key，不使用服务端默认值
  if (!apiKey) {
    return { tips: ['请在设置中配置 AI API Key 后获取每日建议'], updatedAt: new Date().toISOString() };
  }
  const usedKey = apiKey;
  const usedModel = model || 'qwen-plus';
  const systemMsg = customPrompt || '你是一个友好的校园助手，输出纯JSON字符串数组。';
  const today = getCacheKey();

  // 命中缓存
  // 缓存 key 含 prompt，避免换提示词后仍返回旧结果
  const cacheKey = `${today}-${systemMsg.slice(0, 30)}`;
  if (cache && cache.date === today && cache.key === cacheKey) {
    return cache.data;
  }

  // 获取当天课程
  const user = await prisma.user.findFirst();
  if (!user) {
    return { tips: ['还没有课表数据，上传课表后获取每日建议'], updatedAt: new Date().toISOString() };
  }

  const dayStart = new Date(today + 'T00:00:00+08:00');
  const dayEnd = new Date(today + 'T23:59:59+08:00');

  const events = await prisma.event.findMany({
    where: {
      userId: user.id,
      date: { gte: dayStart, lte: dayEnd }
    }
  });

  const courses = await prisma.course.findMany({
    where: { userId: user.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startSection: 'asc' }]
  });

  const todayDayOfWeek = new Date().getDay() || 7; // 周日=0 → 7
  const todayCourses = courses.filter(c => c.dayOfWeek === todayDayOfWeek);

  // 如果没有数据，返回空
  if (todayCourses.length === 0 && events.length === 0) {
    const tips = ['今天没有课程安排，好好休息！也可以去图书馆自习 📚'];
    cache = { data: { tips, updatedAt: new Date().toISOString() }, date: today, key: cacheKey };
    return cache.data;
  }

  // 调用 AI 生成建议
  const courseList = todayCourses.map(c =>
    `${c.name} ${c.startSection}-${c.endSection}节 ${c.location || ''} ${c.teacher ? '教师:' + c.teacher : ''}`
  ).join('\n');

  const eventList = events.map(e =>
    `${e.type === 'exam' ? '📝' : e.type === 'campus_run' ? '🏃' : '📌'} ${e.title} ${e.time || ''} ${e.description || ''}`
  ).join('\n');

  const prompt = `你是一个校园助手。今天是周${['日','一','二','三','四','五','六'][todayDayOfWeek]}。

今日课程：
${courseList || '无'}

今日事件：
${eventList || '无'}

请生成3-5条简短建议/提醒（每条不超过30字），风格友好、像学长/学姐。考虑：
1. 上课时间提醒（第一节课几点）
2. 重要事件提醒（考试等）
3. 空闲时间建议
4. 学习建议
5. 生活小贴士

输出纯JSON数组，如["建议1","建议2"]`;

  try {
    // 根据模型自动选择 API 端点
    const isDeepSeek = usedModel.startsWith('deepseek');
    const apiUrl = isDeepSeek
      ? 'https://api.deepseek.com/chat/completions'
      : 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

    const response = await axios.post(
      apiUrl,
      {
        model: usedModel,
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${usedKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const text = response.data.choices[0].message.content;
    const match = text.match(/\[[\s\S]*\]/);
    let tips: string[] = match ? JSON.parse(match[0]) : [];

    if (tips.length === 0) {
      tips = ['今天又是元气满满的一天！加油 💪'];
    }

    const result: Suggestion = { tips, updatedAt: new Date().toISOString() };
    cache = { data: result, date: today };
    return result;
  } catch (error) {
    console.error('AI 建议生成失败:', error);
    // 降级：返回简单建议
    const tips: string[] = [];
    if (todayCourses.length > 0) {
      const first = todayCourses[0];
      tips.push(`今天第一节课是 ${first.startSection}:00 的${first.name}`);
    }
    if (events.length > 0) {
      tips.push(`今天有 ${events.length} 个重要事件，记得查看`);
    }
    if (todayCourses.length === 0) {
      tips.push('今天没有课，可以自由安排时间 📅');
    }
    if (tips.length === 0) tips.push('新的一天，加油！');
    const result = { tips, updatedAt: new Date().toISOString() };
    cache = { data: result, date: today };
    return result;
  }
}
