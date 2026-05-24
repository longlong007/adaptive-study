import { prisma } from "@/lib/db";
import { getLLM } from "@/lib/llm";
import { parseNodeList, normalizeKind } from "@/lib/llm/parse";
import {
  DECOMPOSE_SYSTEM,
  buildDecomposePrompt,
  buildFirstLevelPrompt,
} from "@/lib/prompts/decompose";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { nodeId, goalId } = await request.json();

  if (!nodeId && !goalId) {
    return NextResponse.json({ error: "nodeId or goalId required" }, { status: 400 });
  }

  // First-level decomposition (goalId only)
  if (goalId && !nodeId) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { nodes: { where: { parentId: null } } },
    });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (goal.nodes.length > 0) {
      return NextResponse.json({ nodes: goal.nodes });
    }

    const clarification = goal.clarification ?? "{}";
    const llm = await getLLM();
    const prompt = buildFirstLevelPrompt(goal.title, clarification);

    const raw = await llm.chat({
      system: DECOMPOSE_SYSTEM,
      messages: [{ role: "user", content: prompt }],
      json: true,
    });

    const parsed = parseNodeList(raw);
    if (!parsed) return NextResponse.json({ error: "LLM parse error", raw }, { status: 500 });

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
            estimatedMinutes: n.estimatedMinutes ?? 60,
          },
        })
      )
    );

    return NextResponse.json({ nodes: created });
  }

  // Sub-level decomposition (nodeId)
  const node = await prisma.node.findUnique({
    where: { id: nodeId },
    include: {
      children: true,
      goal: true,
    },
  });
  if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });

  if (node.children.length > 0) {
    await prisma.node.update({ where: { id: nodeId }, data: { isExpanded: true } });
    return NextResponse.json({ nodes: node.children });
  }

  const clarification = node.goal.clarification ?? "{}";
  const llm = await getLLM();
  const prompt = buildDecomposePrompt(
    node.title,
    node.kind,
    node.summary ?? "",
    clarification
  );

  const raw = await llm.chat({
    system: DECOMPOSE_SYSTEM,
    messages: [{ role: "user", content: prompt }],
    json: true,
  });

  const parsed = parseNodeList(raw);
  if (!parsed) return NextResponse.json({ error: "LLM parse error", raw }, { status: 500 });

  const created = await prisma.$transaction(
    parsed.map((n, i) =>
      prisma.node.create({
        data: {
          goalId: node.goalId,
          parentId: nodeId,
          title: n.title,
          summary: n.summary ?? "",
          kind: normalizeKind(n.kind, "topic"),
          isLeaf: n.isLeaf ?? false,
          order: n.order ?? i,
          estimatedMinutes: n.estimatedMinutes ?? 30,
        },
      })
    )
  );

  await prisma.node.update({ where: { id: nodeId }, data: { isExpanded: true } });

  return NextResponse.json({ nodes: created });
}
