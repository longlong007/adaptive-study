import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, RefreshCw, Plus, BookOpen, Clock } from "lucide-react";

async function getStats() {
  const goals = await prisma.goal.findMany({
    include: {
      nodes: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const dueCount = await prisma.reviewItem.count({
    where: { nextReviewAt: { lte: now } },
  });

  return { goals, dueCount };
}

export default async function HomePage() {
  const { goals, dueCount } = await getStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学习中心</h1>
          <p className="text-sm text-gray-500 mt-1">AI 时代的自适应学习助手</p>
        </div>
        <Link
          href="/goals/new"
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新建目标
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                <Target className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{goals.length}</p>
                <p className="text-xs text-gray-500">学习目标</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {goals.reduce((sum, g) => sum + g.nodes.filter((n) => n.status === "completed").length, 0)}
                </p>
                <p className="text-xs text-gray-500">已完成节点</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Link href="/reviews">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${dueCount > 0 ? "bg-red-50" : "bg-blue-50"}`}>
                  <RefreshCw className={`h-5 w-5 ${dueCount > 0 ? "text-red-600" : "text-blue-600"}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{dueCount}</p>
                  <p className="text-xs text-gray-500">待复习</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="font-semibold text-gray-700 mb-2">还没有学习目标</h3>
          <p className="text-sm text-gray-400 mb-6">创建你的第一个学习目标，开始 AI 辅助学习之旅</p>
          <Link
            href="/goals/new"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            创建目标
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700">我的目标</h2>
          <div className="grid gap-3">
            {goals.map((goal) => {
              const total = goal.nodes.length;
              const completed = goal.nodes.filter((n) => n.status === "completed").length;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <Link key={goal.id} href={`/goals/${goal.id}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-base">{goal.title}</CardTitle>
                        <Badge
                          variant="secondary"
                          className={goal.status === "completed" ? "bg-green-100 text-green-700" : "bg-violet-100 text-violet-700"}
                        >
                          {goal.status === "completed" ? "已完成" : "进行中"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-3">
                        <Progress value={pct} className="flex-1 h-1.5" />
                        <span className="text-xs text-gray-400 shrink-0">
                          {completed}/{total} 节点
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {new Date(goal.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
