import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const goals = await prisma.goal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      nodes: {
        where: { parentId: null },
        orderBy: { order: "asc" },
      },
    },
  });
  return NextResponse.json(goals);
}

export async function POST(request: Request) {
  const { title } = await request.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: { title: title.trim() },
  });

  return NextResponse.json(goal, { status: 201 });
}
