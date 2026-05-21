import { prisma } from "@/lib/db";
import { nextReviewDate } from "@/lib/ebbinghaus";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { notes } = await request.json().catch(() => ({ notes: "" }));

  const node = await prisma.node.findUnique({ where: { id } });
  if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });

  // Mark node as completed
  await prisma.node.update({
    where: { id },
    data: { status: "completed" },
  });

  // Complete any open learning session
  await prisma.learningSession.updateMany({
    where: { nodeId: id, completedAt: null },
    data: { completedAt: new Date(), userNotes: notes ?? "" },
  });

  // Create review item (only if one doesn't exist yet)
  const existing = await prisma.reviewItem.findFirst({ where: { nodeId: id } });
  if (!existing) {
    await prisma.reviewItem.create({
      data: {
        nodeId: id,
        nextReviewAt: nextReviewDate(1),
        intervalDays: 1,
        easeFactor: 2.5,
      },
    });
  }

  return NextResponse.json({ success: true });
}
