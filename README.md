# 校园课表助手 (Smart Campus Assistant)

面向大学生的 Web 端课程管理工具，支持 PDF/图片课表一键 AI 导入、日历三视图、事件管理与天气集成。

## 技术栈

| 前端 | 后端 | AI | 数据库 |
|---|---|---|---|
| React 19 + Vite 8 | Node.js + Express 5 | 阿里云千问 VL Max | SQLite + Prisma 7 |
| Tailwind CSS 4 | TypeScript | PyMuPDF PDF 处理 | better-sqlite3 |
| react-big-calendar | multer 文件上传 | Open-Meteo 天气 | |

## 快速启动

```bash
# 1. 安装依赖
cd server && npm install && npx prisma db push
cd ../client && npm install

# 2. 配置 API Key（申请地址：https://dashscope.aliyun.com）
# 编辑 server/.env，填写 DASHSCOPE_API_KEY

# 3. 确保 Python PyMuPDF 已安装
pip install PyMuPDF

# 4. 双击 start.bat 启动
```

或分别启动：
```bash
# 终端1 - 后端 (端口 5000)
cd server && npx tsx src/server.ts

# 终端2 - 前端 (端口 3000)
cd client && npx vite --host
```

浏览器打开 http://localhost:3000

## 功能

- 📸 **课表智能导入**：上传 PDF 或图片（JPG/PNG/WebP），AI 自动识别课程信息
- 📅 **日历三视图**：月视图（统计+节假日）、周视图（时间线）、日视图（课程表+天气）
- 📝 **事件管理**：考试、提醒、校园跑，标记完成状态
- 🌤️ **天气集成**：自动获取宁波工程学院天气（昨天/今天/明天/后天 + 逐小时）
- 🎯 **零登录**：单用户模式，打开即用

## 项目结构

```
client/          # React 前端
server/          # Express 后端
  prisma/        # 数据库 Schema
  src/
    controllers/ # 请求处理
    services/    # OCR / PDF / 通知
    middleware/   # 认证
start.bat        # Windows 一键启动
stop.bat         # 关闭服务
```
