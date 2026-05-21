"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronDown, Loader2, BookOpen, CheckCircle2, Circle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TreeNode {
  id: string;
  title: string;
  summary?: string | null;
  kind: string;
  isLeaf: boolean;
  isExpanded: boolean;
  status: string;
  estimatedMinutes: number;
  children?: TreeNode[];
}

interface Props {
  nodes: TreeNode[];
  goalId: string;
  level?: number;
}

const KIND_COLORS: Record<string, string> = {
  objective: "bg-purple-100 text-purple-700",
  topic: "bg-blue-100 text-blue-700",
  concept: "bg-green-100 text-green-700",
  action: "bg-orange-100 text-orange-700",
};

const KIND_LABELS: Record<string, string> = {
  objective: "目标",
  topic: "主题",
  concept: "概念",
  action: "操作",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
  if (status === "in_progress") return <Zap className="w-4 h-4 text-yellow-500 shrink-0" />;
  return <Circle className="w-4 h-4 text-gray-300 shrink-0" />;
}

function NodeRow({
  node,
  goalId,
  level,
}: {
  node: TreeNode;
  goalId: string;
  level: number;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(node.isExpanded);
  const [children, setChildren] = useState<TreeNode[]>(node.children ?? []);
  const [loading, setLoading] = useState(false);

  const indent = level * 20;

  async function toggle() {
    if (node.isLeaf) {
      router.push(`/goals/${goalId}/nodes/${node.id}`);
      return;
    }

    if (expanded) {
      setExpanded(false);
      return;
    }

    if (children.length > 0) {
      setExpanded(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/nodes/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: node.id }),
      });
      const data = await res.json();
      setChildren(data.nodes ?? []);
      setExpanded(true);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
          "hover:bg-gray-50",
          node.status === "completed" && "opacity-70"
        )}
        style={{ paddingLeft: `${indent + 12}px` }}
        onClick={toggle}
      >
        {/* Expand icon */}
        <span className="shrink-0 text-gray-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : node.isLeaf ? (
            <BookOpen className="w-4 h-4" />
          ) : expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>

        <StatusIcon status={node.status} />

        <span className="flex-1 min-w-0">
          <span className={cn(
            "text-sm font-medium",
            node.status === "completed" ? "line-through text-gray-400" : "text-gray-800"
          )}>
            {node.title}
          </span>
          {node.summary && (
            <span className="block text-xs text-gray-500 truncate mt-0.5">{node.summary}</span>
          )}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge
            variant="secondary"
            className={cn("text-xs", KIND_COLORS[node.kind] ?? "bg-gray-100 text-gray-600")}
          >
            {KIND_LABELS[node.kind] ?? node.kind}
          </Badge>
          <span className="text-xs text-gray-400">{node.estimatedMinutes}分钟</span>
        </div>
      </div>

      {expanded && children.length > 0 && (
        <PathTree nodes={children} goalId={goalId} level={level + 1} />
      )}
    </div>
  );
}

export function PathTree({ nodes, goalId, level = 0 }: Props) {
  return (
    <div className={level > 0 ? "border-l border-gray-100 ml-4" : ""}>
      {nodes.map((node) => (
        <NodeRow key={node.id} node={node} goalId={goalId} level={level} />
      ))}
    </div>
  );
}
