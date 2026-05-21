# 自适应学习 · Adaptive Study

AI 驱动的自适应学习平台，帮你从目标梳理到路径分解、执行学习、定期复习，全流程智能辅助。

## 功能模块

1. **目标梳理**：输入学习目标，AI 通过对话了解你的背景和需求
2. **路径分解**：将大目标自动拆解为可执行的学习节点（多级树形结构）
3. **学习执行**：按节点学习，AI 生成多模态内容（文字/图表/Mermaid 图）
4. **艾宾浩斯复习**：基于 SM-2 算法的间隔复习调度，自动安排复习时间

## 快速开始

### 环境要求

- Node.js 18+
- npm / pnpm

### 安装步骤

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 默认使用 mock 模式，无需 API Key 即可体验

# 3. 初始化数据库
npm run db:migrate

# 4. 插入测试场景数据（AI 程序员转型路径）
npm run seed

# 5. 启动开发服务器
npm run dev
```

访问 http://localhost:3000 开始使用。

## 切换 AI 模型

编辑 `.env` 文件：

```env
# 使用 DeepSeek（推荐，国内可用）
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_key_here

# 或使用 OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here
```

## 技术栈

- **框架**：Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
- **数据库**：Prisma + SQLite（本地文件，零配置）
- **AI**：抽象 LLMProvider 接口，支持 OpenAI / DeepSeek / Mock
- **状态管理**：React Server Components + Client Components
- **复习算法**：简化版 SM-2（艾宾浩斯变体）

## 项目结构

```
adaptive-study/
├── app/
│   ├── (dashboard)/          # 前台页面（路由组，无 URL 前缀）
│   │   ├── page.tsx          # 首页：目标卡片 + 今日复习徽章
│   │   ├── goals/new/        # 目标梳理对话
│   │   ├── goals/[id]/       # 路径树 + 进度全景
│   │   └── reviews/          # 复习页
│   └── api/                  # API 路由
├── components/
│   ├── content-renderer/     # 多模态内容渲染器
│   ├── path-tree.tsx         # 可展开的学习路径树
│   └── review-card.tsx       # 复习卡片
├── lib/
│   ├── llm/                  # LLM 抽象层
│   ├── prompts/              # Prompt 模板
│   ├── ebbinghaus.ts         # SM-2 复习算法
│   └── db.ts                 # Prisma 客户端单例
├── prisma/schema.prisma      # 数据模型
└── seed/                     # 测试场景种子数据
```

## MVP 范围说明

当前版本（MVP）：
- 文字 + Markdown + 代码块 + Mermaid 图表
- 本地 SQLite，单机使用，无需登录
- 基础的艾宾浩斯复习调度

预留接口（后续迭代）：
- Slide 演示（页面占位已实现）
- 3D 交互动画（组件占位已实现）
- 图片 AI 生成（接口已预留）
- 多端同步、用户账户体系
