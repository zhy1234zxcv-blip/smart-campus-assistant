/*
 * PDF 处理服务
 * 依赖 PyMuPDF (fitz)：pip install PyMuPDF
 * 将 PDF 每页渲染为 350 DPI PNG 图片，再送给 OCR 视觉模型
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * 用 PyMuPDF 将 PDF 页面转为高质量图片
 * 返回 base64 数组
 */
export function pdfToImages(filePath: string): string[] {
  const tempDir = path.dirname(filePath);
  const script = `
import fitz, sys
doc = fitz.open(sys.argv[1])
results = []
for i in range(doc.page_count):
    out_path = f'${tempDir.replace(/\\/g, '\\\\')}/_pdf_page_{i}.png'
    page = doc[i]
    pix = page.get_pixmap(dpi=350)
    pix.save(out_path)
    results.append(out_path)
doc.close()
for r in results:
    print(r)
`;

  const scriptPath = path.join(tempDir, '_convert_pdf.py');
  fs.writeFileSync(scriptPath, script, 'utf-8');

  try {
    const output = execSync(`python "${scriptPath}" "${filePath}"`, {
      encoding: 'utf-8', timeout: 30000
    });
    const paths = output.trim().split('\n').filter(Boolean);
    const images = paths.map(p => {
      const buf = fs.readFileSync(p.trim());
      try { fs.unlinkSync(p.trim()); } catch {}
      return buf.toString('base64');
    });
    return images;
  } finally {
    try { fs.unlinkSync(scriptPath); } catch {}
  }
}
