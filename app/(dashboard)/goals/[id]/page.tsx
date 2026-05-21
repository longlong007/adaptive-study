import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PathTreeServer } from "./path-tree-server";
import { ArrowLeft, Clock } from "lucide-react";

async function getGoal(id: string) {
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      nodes: {
        where: { parentId: null },
        orderBy: { order: "asc" },
        include: {
          children: {
            orderBy: { order: "asc" },
            include: {
              children: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });
  return goal;
}

export default async function GoalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const goal = await getGoal(id);
  if (!goal) notFound();

  const allNodes = await prisma.node.findMany({ where: { goalId: id } });
  const completed = allNodes.filter((n) => n.status === "completed").length;
  const total = allNodes.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  interface Clarification {
    currentLevel?: string;
    weeklyHours?: number;
    priorities?: string[];
    expectedOutcome?: string;
    deadline?: string;
  }
  let clarification: Clarification | null = null;
  if (goal.clarification) {
    try {
      clarification = JSON.parse(goal.clarification) as Clarification;
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Link>
      </div>

      {/* Goal header */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl">{goal.title}</CardTitle>
            <Badge
              variant="secondary"
              className={
                goal.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-violet-100 text-violet-700"
              }
            >
              {goal.status === "completed" ? "已完成" : "进行中"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="flex items-center gap-3">
            <Progress value={pct} className="flex-1 h-2" />
            <span className="text-sm text-gray-500 shrink-0">
              {completed}/{total} 节点 · {pct}%
            </span>
          </div>

          {clarification && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {clarification.currentLevel ? (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 mb-1">当前水平</p>
                  <p className="text-gray-700">{clarification.currentLevel}</p>
                </div>
              ) : null}
              {clarification.weeklyHours ? (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 mb-1">每周投入</p>
                  <p className="text-gray-700 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {clarification.weeklyHours} 小时
                  </p>
                </div>
              ) : null}
              {clarification.expectedOutcome ? (
                <div className="rounded-lg bg-gray-50 p-3 col-span-2">
                  <p className="text-xs text-gray-400 mb-1">期望成果</p>
                  <p className="text-gray-700">{clarification.expectedOutcome}</p>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Path tree */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">学习路径</h2>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2">
            <PathTreeServer nodes={goal.nodes as Parameters<typeof PathTreeServer>[0]["nodes"]} goalId={id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
