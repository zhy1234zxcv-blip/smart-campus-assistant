# 校园课表助手 (Smart Campus Assistant)

面向大学生的 Web 端课程管理工具。上传教务系统 PDF 课表 → 自动识别 → 日历三视图 + 天气 + AI 每日建议。

## 功能

- 📄 **PDF 课表一键导入**：pdfplumber 精准表格提取，教师/教室/周次 100% 识别
- 📅 **日历三视图**：月视图（课程统计+法定节假日）、周/日视图（时间线+天气）
- 🤖 **AI 每日建议**：根据当天课程+事件+天气，生成个性化提醒（支持千问/DeepSeek）
- 🌤️ **天气集成**：Open-Meteo 免费 API，宁波工程学院实时天气+逐小时预报
- 📝 **事件管理**：考试、提醒、校园跑，标记完成状态
- 🎯 **零登录**：单用户模式，打开即用
- 🖥️ **Windows 托盘**：后台运行，右下角图标，像微信一样最小化

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 · Vite 8 · Tailwind CSS 4 · react-big-calendar |
| 后端 | Node.js · Express 5 · TypeScript |
| 数据库 | SQLite · Prisma 7 · better-sqlite3 |
| PDF 解析 | Python · pdfplumber · PyMuPDF |
| AI | 千问 VL Max / DeepSeek V4（可在设置中切换）|
| 天气 | Open-Meteo（免费，无需 Key） |

## 快速启动

```bash
# 1. 安装依赖
cd server && npm install && npx prisma db push
cd ../client && npm install

# 2. 安装 Python 依赖
pip install pdfplumber PyMuPDF

# 3. 配置 API Key（可选，在网页设置中也能配）
# 复制 server/.env.example 为 server/.env，填写 DASHSCOPE_API_KEY

# 4. 双击 start.bat 启动
# 或分步启动：
#   终端1: cd server && npx tsx src/server.ts
#   终端2: cd client && npx vite --host
```

浏览器打开 http://localhost:3000

## 项目结构

```
├── client/                  # React 前端
│   └── src/
│       ├── pages/           # 首页/上传/日历/事件/设置
│       ├── components/      # 布局/路由
│       ├── services/        # API/天气
│       └── utils/           # 日历工具
├── server/                  # Express 后端
│   ├── parse_schedule.py    # PDF 课表解析器（pdfplumber）
│   └── src/
│       ├── controllers/     # 课程/事件/建议
│       ├── services/        # OCR/PDF/建议
│       └── routes/          # API 路由
├── start.bat                # 一键启动
├── stop.bat                 # 关闭服务
├── tray.ps1                 # 系统托盘脚本
└── app.vbs                  # 无窗口启动器
```

## 更新日志

### v2.0 (2026-06-23)
- PDF 课表改用 pdfplumber 精准表格提取，教师/教室 100% 识别
- Windows 系统托盘模式
- 首页 AI 每日建议 + 课程点击弹窗
- 设置页：自定义 API Key / 模型 / AI 风格提示词
- 宁工真实校历（3月2日开学）+ 官方作息时间
- 本地缓存加速

### v1.0 (2026-06-20)
- 基础课表 OCR + 日历三视图 + 天气集成 + 事件管理
