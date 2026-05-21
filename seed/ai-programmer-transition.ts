import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const CLARIFICATION = JSON.stringify({
  currentLevel: "有编程经验的程序员，了解基本的软件开发",
  weeklyHours: 10,
  priorities: ["软件产品思维", "AI 辅助开发技能"],
  expectedOutcome: "能独立规划、设计、开发、测试并上线一个 AI 时代的软件产品",
  deadline: "6 个月",
});

const FIRST_LEVEL_NODES = [
  {
    title: "软件产品思维",
    summary: "学会像产品经理一样思考，理解用户需求，制定产品策略，从 0 到 1 规划产品",
    kind: "objective",
    isLeaf: false,
    order: 0,
    estimatedMinutes: 300,
  },
  {
    title: "设计思维与用户体验",
    summary: "掌握以用户为中心的设计方法，打造优秀的产品界面与交互体验",
    kind: "objective",
    isLeaf: false,
    order: 1,
    estimatedMinutes: 240,
  },
  {
    title: "AI 辅助软件开发技能",
    summary: "用 AI 工具提升编码效率，掌握现代全栈开发实践与架构设计",
    kind: "objective",
    isLeaf: false,
    order: 2,
    estimatedMinutes: 480,
  },
  {
    title: "AI 时代的测试技能",
    summary: "理解测试策略，学会使用 AI 生成测试用例，保障软件质量",
    kind: "objective",
    isLeaf: false,
    order: 3,
    estimatedMinutes: 240,
  },
  {
    title: "现代运维技能（DevOps/云原生）",
    summary: "掌握 CI/CD、容器化、云部署，从开发到上线一人搞定",
    kind: "objective",
    isLeaf: false,
    order: 4,
    estimatedMinutes: 360,
  },
  {
    title: "商业化与变现技能",
    summary: "理解商业模式、定价策略、增长黑客，让产品产生商业价值",
    kind: "objective",
    isLeaf: false,
    order: 5,
    estimatedMinutes: 200,
  },
];

// 预置产品思维的二级节点
const PRODUCT_THINKING_CHILDREN = [
  {
    title: "MVP 概念与产品思维",
    summary: "理解最小可行产品的核心理念，学会用最小代价验证产品假设",
    kind: "concept",
    isLeaf: true,
    order: 0,
    estimatedMinutes: 20,
  },
  {
    title: "用户访谈方法",
    summary: "掌握结构化用户访谈技巧，收集真实的用户需求与痛点",
    kind: "concept",
    isLeaf: true,
    order: 1,
    estimatedMinutes: 25,
  },
  {
    title: "需求优先级排序（RICE 框架）",
    summary: "使用 RICE（Reach/Impact/Confidence/Effort）对功能需求进行量化排序",
    kind: "action",
    isLeaf: true,
    order: 2,
    estimatedMinutes: 20,
  },
  {
    title: "产品路线图制定",
    summary: "将用户需求转化为可执行的产品规划，平衡短期目标与长期愿景",
    kind: "action",
    isLeaf: true,
    order: 3,
    estimatedMinutes: 25,
  },
];

// 预置 MVP 概念的学习内容
const MVP_CONTENT_BLOCKS = [
  {
    kind: "markdown",
    order: 0,
    payload: JSON.stringify({
      content: `## MVP（最小可行产品）

**MVP（Minimum Viable Product，最小可行产品）** 是具备足够功能可以吸引早期客户，并用于验证产品假设的最小版本。

### 为什么需要 MVP？

在 AI 时代，产品迭代速度极快。MVP 的核心价值在于：

- **最小化浪费**：避免在错误方向上投入大量资源
- **快速验证**：以最低成本测试核心业务假设
- **学习导向**：每次迭代都获得真实用户反馈
- **降低风险**：在全力投入前确认市场需求

### 经典案例

| 产品 | MVP 形式 | 验证的假设 |
|------|----------|------------|
| Dropbox | 3 分钟演示视频 | 用户是否需要跨设备文件同步 |
| Airbnb | 简陋的手工网站 | 有人愿意租出自己的房间 |
| Zappos | 先卖鞋后采购 | 用户愿意在网上买鞋 |

### 类比理解

> MVP 就像烹饪前的「试味」——用一小口确认调味是否对，而不是做完整桌菜再发现方向不对。`,
    }),
  },
  {
    kind: "mermaid",
    order: 1,
    payload: JSON.stringify({
      code: `flowchart LR
  A[想法/假设] --> B[构建 MVP]
  B --> C[发布给用户]
  C --> D[收集数据]
  D --> E{假设成立？}
  E -->|是| F[迭代扩展]
  E -->|否| G[调整方向]
  F --> B
  G --> A`,
      caption: "Build-Measure-Learn 循环：MVP 的核心工作流程",
    }),
  },
  {
    kind: "markdown",
    order: 2,
    payload: JSON.stringify({
      content: `### 自检题

思考以下问题来检验你的理解：

1. **基础理解**：MVP 和「半成品」有什么本质区别？MVP 为什么不等于低质量产品？

2. **案例分析**：如果你要做一个 AI 写作助手，你的 MVP 会包含哪些核心功能？哪些功能应该推迟到后续版本？

3. **应用思考**：在你目前的工作或项目中，有没有可以应用 MVP 思维来减少浪费的地方？举一个具体例子。`,
    }),
  },
];

async function main() {
  console.log("开始插入种子数据...");

  // 检查是否已存在
  const existing = await prisma.goal.findFirst({
    where: { title: { contains: "AI 新时代的程序员转型" } },
  });

  if (existing) {
    console.log("种子数据已存在，跳过插入");
    return;
  }

  // 创建目标
  const goal = await prisma.goal.create({
    data: {
      title: "AI 新时代的程序员转型学习路径",
      clarification: CLARIFICATION,
      status: "active",
    },
  });
  console.log(`✓ 创建目标：${goal.title}`);

  // 创建一级节点
  const firstLevelNodes = await Promise.all(
    FIRST_LEVEL_NODES.map((n) =>
      prisma.node.create({
        data: { goalId: goal.id, ...n },
      })
    )
  );
  console.log(`✓ 创建 ${firstLevelNodes.length} 个一级节点`);

  // 找到「软件产品思维」节点，为其创建二级节点
  const productNode = firstLevelNodes[0];

  const secondLevelNodes = await Promise.all(
    PRODUCT_THINKING_CHILDREN.map((n) =>
      prisma.node.create({
        data: { goalId: goal.id, parentId: productNode.id, ...n },
      })
    )
  );
  console.log(`✓ 创建 ${secondLevelNodes.length} 个二级节点（产品思维 → ...）`);

  // 标记产品思维节点已展开
  await prisma.node.update({
    where: { id: productNode.id },
    data: { isExpanded: true },
  });

  // 为 MVP 节点创建预制内容
  const mvpNode = secondLevelNodes[0];
  await Promise.all(
    MVP_CONTENT_BLOCKS.map((b) =>
      prisma.contentBlock.create({
        data: { nodeId: mvpNode.id, ...b },
      })
    )
  );
  console.log(`✓ 为「${mvpNode.title}」创建预制学习内容`);

  // 模拟已完成 MVP 节点，创建复习记录
  await prisma.node.update({
    where: { id: mvpNode.id },
    data: { status: "completed" },
  });

  const now = new Date();
  const reviewDate = new Date(now);
  reviewDate.setDate(reviewDate.getDate() + 1);
  reviewDate.setHours(9, 0, 0, 0);

  await prisma.reviewItem.create({
    data: {
      nodeId: mvpNode.id,
      intervalDays: 1,
      easeFactor: 2.5,
      reviewCount: 0,
      nextReviewAt: reviewDate,
    },
  });
  console.log(`✓ 为「${mvpNode.title}」创建复习计划（明日 09:00）`);

  // 为「用户访谈方法」创建一个即将到期的复习（演示复习页面）
  const interviewNode = secondLevelNodes[1];
  await prisma.node.update({
    where: { id: interviewNode.id },
    data: { status: "completed" },
  });

  const overdueDate = new Date(now);
  overdueDate.setDate(overdueDate.getDate() - 1); // 昨天，已到期

  await prisma.reviewItem.create({
    data: {
      nodeId: interviewNode.id,
      intervalDays: 1,
      easeFactor: 2.5,
      reviewCount: 0,
      nextReviewAt: overdueDate,
    },
  });
  console.log(`✓ 为「${interviewNode.title}」创建已到期复习记录（演示用）`);

  console.log("\n🎉 种子数据插入完成！");
  console.log(`\n目标 ID：${goal.id}`);
  console.log("现在可以运行 pnpm dev 并访问 http://localhost:3000 体验应用");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
