import { PathTree, type TreeNode } from "@/components/path-tree";

interface ServerNode {
  id: string;
  title: string;
  summary?: string | null;
  kind: string;
  isLeaf: boolean;
  isExpanded: boolean;
  status: string;
  estimatedMinutes: number;
  children?: ServerNode[];
}

interface Props {
  nodes: ServerNode[];
  goalId: string;
}

function toTreeNode(node: ServerNode): TreeNode {
  return {
    id: node.id,
    title: node.title,
    summary: node.summary,
    kind: node.kind,
    isLeaf: node.isLeaf,
    isExpanded: node.isExpanded,
    status: node.status,
    estimatedMinutes: node.estimatedMinutes,
    children: node.children?.map(toTreeNode),
  };
}

export function PathTreeServer({ nodes, goalId }: Props) {
  const treeNodes = nodes.map(toTreeNode);
  return <PathTree nodes={treeNodes} goalId={goalId} />;
}
