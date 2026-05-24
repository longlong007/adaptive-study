function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

function tryParse<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// 从 LLM 输出中提取 JSON：支持裸 JSON、代码围栏包裹、混入推理文本等情形。
export function extractJSON<T = unknown>(raw: string): T | null {
  if (!raw) return null;

  const cleaned = stripCodeFence(raw);
  const direct = tryParse<T>(cleaned);
  if (direct !== null) return direct;

  const firstObj = cleaned.indexOf("{");
  const firstArr = cleaned.indexOf("[");
  const start =
    firstObj === -1
      ? firstArr
      : firstArr === -1
      ? firstObj
      : Math.min(firstObj, firstArr);
  if (start === -1) return null;

  const open = cleaned[start];
  const close = open === "{" ? "}" : "]";
  const end = cleaned.lastIndexOf(close);
  if (end <= start) return null;

  return tryParse<T>(cleaned.slice(start, end + 1));
}

// 解析"节点列表"，兼容 { nodes: [...] } / [...] / { data: [...] } 等多种形态。
export interface ParsedNode {
  title: string;
  summary?: string;
  kind?: string;
  isLeaf?: boolean;
  order?: number;
  estimatedMinutes?: number;
}

export function parseNodeList(raw: string): ParsedNode[] | null {
  const data = extractJSON<unknown>(raw);
  if (!data) return null;

  if (Array.isArray(data)) return data as ParsedNode[];
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    for (const key of ["nodes", "items", "data", "children", "list"]) {
      const v = obj[key];
      if (Array.isArray(v)) return v as ParsedNode[];
    }
  }
  return null;
}

// 解析"内容块列表"
export interface ParsedBlock {
  kind: string;
  payload: Record<string, unknown>;
}

export function parseBlockList(raw: string): ParsedBlock[] | null {
  const data = extractJSON<unknown>(raw);
  if (!data) return null;

  if (Array.isArray(data)) return data as ParsedBlock[];
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    for (const key of ["blocks", "items", "data", "content"]) {
      const v = obj[key];
      if (Array.isArray(v)) return v as ParsedBlock[];
    }
  }
  return null;
}

// 解析"复习题列表"
export function parseQuestionList(raw: string): string[] | null {
  const data = extractJSON<unknown>(raw);
  if (!data) return null;

  if (Array.isArray(data)) return data.map(String);
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    for (const key of ["questions", "items", "data", "list"]) {
      const v = obj[key];
      if (Array.isArray(v)) return v.map(String);
    }
  }
  return null;
}

// kind 字段标准化：将 LLM 偶尔输出的非标准值映射回 4 种允许值
export function normalizeKind(
  raw: string | undefined,
  fallback: "objective" | "topic" | "concept" | "action"
): "objective" | "topic" | "concept" | "action" {
  if (!raw) return fallback;
  const v = raw.toLowerCase().trim();
  if (["objective", "目标", "objectives"].includes(v)) return "objective";
  if (["topic", "主题", "topics", "area"].includes(v)) return "topic";
  if (["concept", "概念", "concepts", "knowledge"].includes(v)) return "concept";
  if (["action", "操作", "step", "task", "actions"].includes(v)) return "action";
  if (["node", "leaf", "item"].includes(v)) return fallback;
  return fallback;
}
