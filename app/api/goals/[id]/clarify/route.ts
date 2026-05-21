import { prisma } from "@/lib/db";
import { getLLM } from "@/lib/llm";
import {
  CLARIFY_SYSTEM,
  buildClarifyUserPrompt,
} from "@/lib/prompts/clarify";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userReply, history = [] } = await request.json();

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const llm = await getLLM();
  const userPrompt = buildClarifyUserPrompt(goal.title, history, userReply);

  const messages = [
    ...history,
    { role: "user" as const, content: userPrompt },
  ];

  const raw = await llm.chat({ system: CLARIFY_SYSTEM, messages, json: true });

  let parsed: {
    phase: string;
    question?: string;
    fields?: string[];
    clarification?: Record<string, unknown>;
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "LLM parse error", raw }, { status: 500 });
  }

  if (parsed.phase === "done" && parsed.clarification) {
    await prisma.goal.update({
      where: { id },
      data: { clarification: JSON.stringify(parsed.clarification) },
    });
  }

  return NextResponse.json({
    ...parsed,
    assistantMessage: raw,
  });
}
