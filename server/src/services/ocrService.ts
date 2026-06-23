/*
 * OCR 服务
 * - 图片：qwen-vl-max 视觉模型
 * - 文本：qwen-plus 文本模型
 * - cleanCourse() 清洗 AI 返回的脏数据（教师/教室/周次字段混入杂数据）
 */
import axios from 'axios';

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

const IMAGE_PROMPT = `你是课表解析专家。请仔细解析课表图片中的每一格内容。

课表结构（关键！）：
- 顶部表头从左到右第1列=星期一、第2列=星期二、第3列=星期三、第4列=星期四、第5列=星期五、第6列=星期六、第7列=星期日
- 左侧：节次（1-2节, 3-4节, 5-6节, 6-7节, 8-9节, 10-11节等）

⚠️ 重要：请逐一核对每个格子在表格中的实际列位置来确定dayOfWeek，不要靠课程名推测星期！表格列从左到右依次是1到7。

每格包含多行文字，格式通常为：
课程名
(节次范围)
周次信息/校区/场地/教师/教学班...

请遍历所有格子，提取每门课：
{
  "name": "课程名（如'高等数学AⅡ'、'大学物理B'）",
  "teacher": "教师名（从'教师:XXX'中提取XXX）",
  "location": "教室名（从'场地:XXX'中提取XXX）",
  "weeks": "周次（如'1-13周,15-17周(单),18周'，原样保留）",
  "dayOfWeek": 所在列号（第1列周一=1,第2列周二=2,...,第7列周日=7），
  "startSection": 所在行的起始节次数字，
  "endSection": 所在行的结束节次数字
}

关键规则：
- 每个有文字的格子就是一门课，不要遗漏任何格子
- dayOfWeek必须根据课表顶部的星期列来确定
- 只返回JSON数组`;

const TEXT_PROMPT = `你是课表解析专家。下方是PDF课表的文字提取，每行格式为：
[星期 Y=行坐标] 文字内容

课表是一个表格：
- 列 = 星期一~星期日（已标注在每行开头）
- 行 = 节次（行坐标 Y 越大越靠下，同一 Y 值属于同一行）

解析规则：
1. 每行是一个独立文本块。课程名和课程详情分别在相邻行中
2. 课程名所在行后面紧跟的下一行通常就是该课程的详细信息
3. 从详细信息中精准提取：
   - name: 课程名（如"高等数学AⅡ"、"思想道德与法治"）
   - teacher: "教师:XXX"→提取XXX
   - location: "场地:XXX"→提取XXX
   - weeks: 提取周次部分，如"1-13周,15-17周(单),18周"
   - dayOfWeek: 方括号里已标注（周一=1...周日=7）
   - startSection/endSection: 从"(N-M节)"提取数字，如(1-2节)→1,2

4. ⚠️ 输出纯JSON数组，一行一个，不要markdown`;

async function callQwenVL(messages: any[]): Promise<CourseData[]> {
  const response = await axios.post(
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    {
      model: 'qwen-vl-max',
      messages
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000  // 大图识别可能较慢，120秒超时
    }
  );
  const text = response.data.choices[0].message.content;
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('AI 返回格式异常');
  return JSON.parse(m[0]);
}

async function callQwenText(systemPrompt: string, userContent: string): Promise<CourseData[]> {
  const response = await axios.post(
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    {
      model: 'qwen-max',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    }
  );
  const text = response.data.choices[0].message.content;
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error('AI 返回格式异常');
  return JSON.parse(m[0]);
}

// 图片识别（视觉模型）
// 清洗 AI 返回的脏数据
function cleanCourse(c: CourseData): CourseData {
  // 清洗 teacher：提取 "教师:XXX" 中的 XXX
  if (c.teacher) {
    const tm = c.teacher.match(/教师[：:]\s*([^/；;\n]+)/);
    if (tm) c.teacher = tm[1].trim();
    if (c.teacher && c.teacher.length > 10) c.teacher = ''; // 太长的不是教师名
  }
  // 清洗 location：提取 "场地:XXX" 中的 XXX
  if (c.location) {
    const lm = c.location.match(/场地[：:]\s*([^/；;\n]+)/);
    if (lm) c.location = lm[1].trim();
    if (c.location && (c.location.includes('教学班') || c.location.length > 20)) c.location = '';
  }
  // 清洗 weeks：去掉多余的后缀信息
  if (c.weeks) {
    c.weeks = c.weeks.replace(/\/校区[^周]*/g, '').replace(/\/教师[^周]*/g, '');
    // 如果weeks包含"节)"前缀格式如"(1-2节)1-16周" → 提取"1-16周"
    const wm = c.weeks.match(/(\d+-\d+周[^/]*)$/);
    if (wm) c.weeks = wm[1];
  }
  return c;
}

export async function parseScheduleImage(imageBase64: string): Promise<CourseData[]> {
  const courses = await callQwenVL([
    { role: 'system', content: IMAGE_PROMPT },
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: 'text', text: '请解析这张课表图片,提取所有课程。' }
      ]
    }
  ]);
  return courses.map(cleanCourse);
}

// PDF 文本识别（文本模型，更快更准）
export async function parseScheduleText(text: string): Promise<CourseData[]> {
  return callQwenText(TEXT_PROMPT, text);
}
