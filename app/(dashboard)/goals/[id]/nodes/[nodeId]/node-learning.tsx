"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ContentRenderer, type ContentBlock } from "@/components/content-renderer";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

interface NodeInfo {
  id: string;
  title: string;
  goalId: string;
  status: string;
}

interface Props {
  node: NodeInfo;
  initialBlocks: ContentBlock[];
}

export function NodeLearning({ node, initialBlocks }: Props) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [loading, setLoading] = useState(initialBlocks.length === 0);
  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(node.status === "completed");

  useEffect(() => {
    if (initialBlocks.length > 0) return;

    async function load() {
      try {
        const res = await fetch(`/api/nodes/${node.id}/content`, { method: "POST" });
        const data = await res.json();
        setBlocks(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [node.id, initialBlocks.length]);

  async function markComplete() {
    setCompleting(true);
    try {
      await fetch(`/api/nodes/${node.id}/complete`, { method: "POST" });
      setDone(true);
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-4" />
        <p className="text-gray-500">AI 正在生成学习内容…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        {blocks.length > 0 ? (
          <ContentRenderer blocks={blocks} />
        ) : (
          <p className="text-gray-400 text-center py-8">暂无内容</p>
        )}
      </div>

      {/* Complete action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/goals/${node.goalId}`)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回路径
        </button>

        {done ? (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle2 className="w-5 h-5" />
            已完成，复习计划已创建
          </div>
        ) : (
          <button
            onClick={markComplete}
            disabled={completing}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {completing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            标记完成，创建复习计划
          </button>
        )}
      </div>
    </div>
  );
}
