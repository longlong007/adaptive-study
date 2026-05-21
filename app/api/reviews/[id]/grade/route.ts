import { prisma } from "@/lib/db";
import { getLLM } from "@/lib/llm";
import { nextInterval, nextReviewDate, type Grade } from "@/lib/ebbinghaus";
import { REVIEW_SYSTEM, buildReviewPrompt } from "@/lib/prompts/review";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { grade } = await request.json();

  const item = await prisma.reviewItem.findUnique({
    where: { id },
    include: { node: true },
  });
  if (!item) return NextResponse.json({ error: "Review item not found" }, { status: 404 });

  const { intervalDays, easeFactor } = nextInterval(item, grade as Grade);

  const updated = await prisma.reviewItem.update({
    where: { id },
    data: {
      intervalDays,
      easeFactor,
      reviewCount: item.reviewCount + 1,
      lastReviewedAt: new Date(),
      nextReviewAt: nextReviewDate(intervalDays),
      lastGrade: grade,
    },
  });

  return NextResponse.json(updated);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const item = await prisma.reviewItem.findUnique({
    where: { id },
    include: { node: true },
  });
  if (!item) return NextResponse.json({ error: "Review item not found" }, { status: 404 });

  const llm = await getLLM();
  const prompt = buildReviewPrompt(
    item.node.title,
    item.node.summary ?? "",
    item.reviewCount
  );

  const raw = await llm.chat({
    system: REVIEW_SYSTEM,
    messages: [{ role: "user", content: prompt }],
    json: true,
  });

  let questions: string[] = [];
  try {
    const parsed = JSON.parse(raw);
    questions = parsed.questions ?? [];
  } catch {
    questions = ["请回忆该知识点的核心内容", "举一个实际应用的例子", "如何将这个知识点与其他知识联系起来？"];
  }

  return NextResponse.json({ item, questions });
}
