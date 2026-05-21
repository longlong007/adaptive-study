import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date();

  const dueItems = await prisma.reviewItem.findMany({
    where: { nextReviewAt: { lte: now } },
    include: {
      node: {
        include: { goal: true },
      },
    },
    orderBy: { nextReviewAt: "asc" },
  });

  const upcoming = await prisma.reviewItem.findMany({
    where: { nextReviewAt: { gt: now } },
    include: {
      node: {
        include: { goal: true },
      },
    },
    orderBy: { nextReviewAt: "asc" },
    take: 10,
  });

  return NextResponse.json({ due: dueItems, upcoming });
}
