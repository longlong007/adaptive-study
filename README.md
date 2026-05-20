# Adaptive Study — 自适应学习软件

AI 驱动的自适应学习 Web 应用，包含目标梳理、路径分解、学习执行、复习四大模块。

## 技术栈

- **框架**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **AI**: DeepSeek API（预留多模型接口）
- **数据库**: SQLite + Prisma ORM
- **包管理**: pnpm

## 模块

1. **目标梳理模块** — 对话式需求澄清，生成结构化学习目标
2. **路径分解模块** — 多级递归分解，可视化学习路径树
3. **学习执行模块** — 多模态内容生成（文字/图文/Slides/3D）
4. **复习模块** — 基于艾宾浩斯遗忘曲线的定期复习推送

## 快速开始

```bash
pnpm install
cp .env.example .env.local  # 填入 DEEPSEEK_API_KEY
pnpm prisma migrate dev
pnpm dev
```
