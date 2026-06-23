/*
 * PDF 课表解析器
 * 调用 parse_schedule.py（pdfplumber 表格提取，零 AI 依赖）
 */
import { execSync } from 'child_process';
import path from 'path';

interface CourseData {
  name: string;
  teacher: string;
  location: string;
  weeks: string;
  dayOfWeek: number;
  startSection: number;
  endSection: number;
}

export function parseSchedulePdf(filePath: string): CourseData[] {
  const scriptPath = path.join(__dirname, '../../parse_schedule.py');
  const outputPath = filePath + '.result.json';
  // 用文件传递结果，彻底避免编码问题
  execSync(`python "${scriptPath}" "${filePath}" "${outputPath}"`, {
    timeout: 30000,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  });
  const result = JSON.parse(require('fs').readFileSync(outputPath, 'utf-8'));
  try { require('fs').unlinkSync(outputPath); } catch {}
  return result;
}
