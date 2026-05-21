import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NodeLearning } from "./node-learning";

const KIND_LABELS: Record<string, string> = {
  objective: "目标",
  topic: "主题",
  concept: "概念",
  action: "操作",
};

export default async function NodePage({
  params,
}: {
  params: Promise<{ id: string; nodeId: string }>;
}) {
  const { id: goalId, nodeId } = await params;

  const node = await prisma.node.findUnique({
    where: { id: nodeId },
    include: {
      parent: true,
      goal: true,
      contentBlocks: { orderBy: { order: "asc" } },
    },
  });

  if (!node) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600 transition-colors">首页</Link>
        <span>/</span>
        <Link href={`/goals/${goalId}`} className="hover:text-gray-600 transition-colors truncate max-w-[150px]">
          {node.goal.title}
        </Link>
        {node.parent && (
          <>
            <span>/</span>
            <span className="truncate max-w-[120px]">{node.parent.title}</span>
          </>
        )}
        <span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-[150px]">{node.title}</span>
      </div>

      {/* Node header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{node.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-xs">
              {KIND_LABELS[node.kind] ?? node.kind}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {node.estimatedMinutes} 分钟
            </Badge>
          </div>
        </div>
        {node.summary && <p className="text-gray-500">{node.summary}</p>}
      </div>

      {/* Content area */}
      <NodeLearning
        node={{
          id: node.id,
          title: node.title,
          goalId,
          status: node.status,
        }}
        initialBlocks={node.contentBlocks.map((b) => ({
          id: b.id,
          kind: b.kind,
          payload: b.payload,
          order: b.order,
        }))}
      />
    </div>
  );
}
