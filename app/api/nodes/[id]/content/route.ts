import { prisma } from "@/lib/db";
import { getLLM } from "@/lib/llm";
import { parseBlockList } from "@/lib/llm/parse";
import { CONTENT_SYSTEM, buildContentPrompt } from "@/lib/prompts/content";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const blocks = await prisma.contentBlock.findMany({
    where: { nodeId: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(blocks);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const node = await prisma.node.findUnique({
    where: { id },
    include: {
      parent: true,
      contentBlocks: { orderBy: { order: "asc" } },
    },
  });
  if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });

  // Return cached if exists
  if (node.contentBlocks.length > 0) {
    return NextResponse.json(node.contentBlocks);
  }

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
  if (!parsed) {
    return NextResponse.json({ error: "LLM parse error", raw }, { status: 500 });
  }

  const blocks = await prisma.$transaction(
    parsed.map((b, i) =>
      prisma.contentBlock.create({
        data: {
          nodeId: id,
          kind: b.kind,
          payload: JSON.stringify(b.payload ?? {}),
          order: i,
        },
      })
    )
  );

  // Start a learning session
  await prisma.learningSession.create({
    data: { nodeId: id },
  });

  // Mark node as in progress
  await prisma.node.update({
    where: { id },
    data: { status: "in_progress" },
  });

  return NextResponse.json(blocks);
}
