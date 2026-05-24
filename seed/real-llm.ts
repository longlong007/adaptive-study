/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 真实 LLM 种子脚本：通过配置的 LLMProvider 端到端生成学习数据。
 *
 * 范围（与 mock seed 一致，便于对照）：
 *   1. 创建 1 个 Goal（带预置 clarification）
 *   2. 调 LLM 生成 6 个一级节点
 *   3. 对前 2 个一级节点分别调 LLM 生成二级节点
 *   4. 选择前 2 个叶子节点：第 1 个生成完整 ContentBlock + 已到期复习，第 2 个生成明日复习
 *
 * 使用：
 *   LLM_PROVIDER=deepseek DEEPSEEK_API_KEY=xxx npm run seed:real
 */

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { getLLM } from "../lib/llm";
import {
  DECOMPOSE_SYSTEM,
  buildDecomposePrompt,
  buildFirstLevelPrompt,
} from "../lib/prompts/decompose";
import { CONTENT_SYSTEM, buildContentPrompt } from "../lib/prompts/content";
import {
  parseNodeList,
  parseBlockList,
  normalizeKind,
} from "../lib/llm/parse";

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as any);

const GOAL_TITLE = "AI 新时代的程序员转型学习路径";
const CLARIFICATION = {
  currentLevel: "有编程经验的程序员，了解基本的软件开发",
  weeklyHours: 10,
  priorities: ["软件产品思维", "AI 辅助开发技能"],
  expectedOutcome: "能独立规划、设计、开发、测试并上线一个 AI 时代的软件产品",
  deadline: "6 个月",
};

function logStep(msg: string) {
  process.stdout.write(`\n▸ ${msg}\n`);
}

async function clearGoals() {
  const result = await prisma.goal.deleteMany({});
  if (result.count > 0) {
    process.stdout.write(`  已清理 ${result.count} 条旧目标（级联删除子表）\n`);
  }
}

async function generateFirstLevel(goalId: string, goalTitle: string) {
  const llm = await getLLM();
  const prompt = buildFirstLevelPrompt(goalTitle, JSON.stringify(CLARIFICATION));
  const raw = await llm.chat({
    system: DECOMPOSE_SYSTEM,
    messages: [{ role: "user", content: prompt }],
    json: true,
  });
  const parsed = parseNodeList(raw);
  if (!parsed || parsed.length === 0) {
    throw new Error(`一级节点解析失败：${raw.slice(0, 200)}`);
  }

  const created = await prisma.$transaction(
    parsed.map((n, i) =>
      prisma.node.create({
        data: {
          goalId,
          parentId: null,
          title: n.title,
          summary: n.summary ?? "",
          kind: normalizeKind(n.kind, "objective"),
          isLeaf: n.isLeaf ?? false,
          order: n.order ?? i,
          estimatedMinutes: n.estimatedMinutes ?? 120,
        },
      })
    )
  );
  return created;
}

async function generateChildren(parentId: string) {
  const node = await prisma.node.findUnique({
    where: { id: parentId },
    include: { goal: true },
  });
  if (!node) throw new Error("parent not found");

  const llm = await getLLM();
  const prompt = buildDecomposePrompt(
    node.title,
    node.kind,
    node.summary ?? "",
    node.goal.clarification ?? "{}"
  );
  const raw = await llm.chat({
    system: DECOMPOSE_SYSTEM,
    messages: [{ role: "user", content: prompt }],
    json: true,
  });
  const parsed = parseNodeList(raw);
  if (!parsed || parsed.length === 0) {
    throw new Error(`二级节点解析失败：${raw.slice(0, 200)}`);
  }

  const created = await prisma.$transaction(
    parsed.map((n, i) =>
      prisma.node.create({
        data: {
          goalId: node.goalId,
          parentId,
          title: n.title,
          summary: n.summary ?? "",
          kind: normalizeKind(n.kind, "topic"),
          isLeaf: n.isLeaf ?? false,
          order: n.order ?? i,
          estimatedMinutes: n.estimatedMinutes ?? 25,
        },
      })
    )
  );

  await prisma.node.update({
    where: { id: parentId },
    data: { isExpanded: true },
  });

  return created;
}

async function generateContent(nodeId: string) {
  const node = await prisma.node.findUnique({
    where: { id: nodeId },
    include: { parent: true },
  });
  if (!node) throw new Error("node not found");

  const parentContext = node.parent
    ? `${node.parent.title}：${node.parent.summary ?? ""}`
    : "顶级目标";

  const llm = await getLLM();
  const prompt = buildContentPrompt(
    node.title,
    node.summary ?? "",
    node.kind,
    parentContext
  );
  const raw = await llm.chat({
    system: CONTENT_SYSTEM,
    messages: [{ role: "user", content: prompt }],
    json: true,
  });
  const parsed = parseBlockList(raw);
  if (!parsed || parsed.length === 0) {
    throw new Error(`内容块解析失败：${raw.slice(0, 200)}`);
  }

  await prisma.$transaction(
    parsed.map((b, i) =>
      prisma.contentBlock.create({
        data: {
          nodeId,
          kind: b.kind,
          payload: JSON.stringify(b.payload ?? {}),
          order: i,
        },
      })
    )
  );

  return parsed.length;
}

function nextReviewDate(daysOffset: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(9, 0, 0, 0);
  return d;
}

async function main() {
  const provider = process.env.LLM_PROVIDER ?? "mock";
  process.stdout.write(`使用 LLM 提供商：${provider}\n`);

  if (provider === "mock") {
    process.stdout.write(
      "⚠ 当前为 mock 模式，将使用内置 fixture 数据。若要真实 LLM，请在 .env 中设置 LLM_PROVIDER=deepseek 或 openai。\n"
    );
  }

  logStep("清理旧数据");
  await clearGoals();

  logStep(`创建目标：${GOAL_TITLE}`);
  const goal = await prisma.goal.create({
    data: {
      title: GOAL_TITLE,
      clarification: JSON.stringify(CLARIFICATION),
      status: "active",
    },
  });
  process.stdout.write(`  goal.id = ${goal.id}\n`);

  logStep("调用 LLM 生成一级节点（约 5-15 秒）…");
  const t1 = Date.now();
  const firstLevel = await generateFirstLevel(goal.id, GOAL_TITLE);
  process.stdout.write(
    `  生成 ${firstLevel.length} 个一级节点（耗时 ${((Date.now() - t1) / 1000).toFixed(1)}s）\n`
  );
  firstLevel.forEach((n, i) => process.stdout.write(`    ${i + 1}. ${n.title} (${n.kind})\n`));

  const toDecompose = firstLevel.slice(0, 2);
  for (const parent of toDecompose) {
    logStep(`分解一级节点「${parent.title}」（约 5-15 秒）…`);
    const t2 = Date.now();
    const children = await generateChildren(parent.id);
    process.stdout.write(
      `  生成 ${children.length} 个子节点（耗时 ${((Date.now() - t2) / 1000).toFixed(1)}s）\n`
    );
    children.forEach((n, i) =>
      process.stdout.write(
        `    ${i + 1}. ${n.title} [${n.kind}, isLeaf=${n.isLeaf}, ${n.estimatedMinutes}min]\n`
      )
    );
  }

  // 兜底：若二级分解没有产出叶子，再向下分一层（最多 3 个非叶子节点）
  let leaves = await prisma.node.findMany({
    where: { goalId: goal.id, isLeaf: true },
    orderBy: [{ parentId: "asc" }, { order: "asc" }],
    take: 4,
  });

  if (leaves.length === 0) {
    logStep("二级未产出叶子，继续向下分解一层…");
    const nonLeaves = await prisma.node.findMany({
      where: { goalId: goal.id, isLeaf: false, parentId: { not: null } },
      orderBy: { order: "asc" },
      take: 3,
    });
    for (const n of nonLeaves) {
      const t = Date.now();
      const c = await generateChildren(n.id);
      process.stdout.write(
        `  ${n.title} → ${c.length} 个孙节点（${((Date.now() - t) / 1000).toFixed(1)}s）\n`
      );
    }
    leaves = await prisma.node.findMany({
      where: { goalId: goal.id, isLeaf: true },
      orderBy: [{ parentId: "asc" }, { order: "asc" }],
      take: 4,
    });
  }

  // 仅取前 2 个叶子用于生成内容 + 复习
  leaves = leaves.slice(0, 2);

  if (leaves.length === 0) {
    process.stdout.write(
      "\n⚠ 未生成任何叶子节点。检查 LLM 是否正确按 isLeaf 标记节点。\n"
    );
  } else {
    for (let i = 0; i < leaves.length; i++) {
      const leaf = leaves[i];
      logStep(`为叶子节点「${leaf.title}」生成学习内容（约 8-20 秒）…`);
      const t3 = Date.now();
      const blockCount = await generateContent(leaf.id);
      process.stdout.write(
        `  生成 ${blockCount} 个内容块（耗时 ${((Date.now() - t3) / 1000).toFixed(1)}s）\n`
      );

      await prisma.node.update({
        where: { id: leaf.id },
        data: { status: "completed" },
      });
      await prisma.learningSession.create({
        data: {
          nodeId: leaf.id,
          completedAt: new Date(),
          userNotes: "（示例：已完成学习）",
        },
      });

      // 第一个：已到期；第二个：明日到期
      const overdueOffset = i === 0 ? -1 : 1;
      await prisma.reviewItem.create({
        data: {
          nodeId: leaf.id,
          intervalDays: 1,
          easeFactor: 2.5,
          reviewCount: 0,
          nextReviewAt: nextReviewDate(overdueOffset),
        },
      });
      process.stdout.write(
        `  ✓ 标记完成，复习计划：${overdueOffset < 0 ? "已到期" : "明日 09:00"}\n`
      );
    }
  }

  const stats = await prisma.node.groupBy({
    by: ["isLeaf"],
    where: { goalId: goal.id },
    _count: { _all: true },
  });
  const reviewCount = await prisma.reviewItem.count();
  const blockCount = await prisma.contentBlock.count();

  process.stdout.write("\n=========== 完成 ===========\n");
  for (const s of stats) {
    process.stdout.write(`  ${s.isLeaf ? "叶子节点" : "非叶子"}：${s._count._all}\n`);
  }
  process.stdout.write(`  内容块：${blockCount}\n  复习项：${reviewCount}\n`);
  process.stdout.write(`\n访问 http://localhost:3000 查看效果\n`);
}

main()
  .catch((err) => {
    process.stderr.write(`\n✗ Seed 失败：${String(err?.message ?? err)}\n`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
