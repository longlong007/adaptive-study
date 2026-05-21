export const DECOMPOSE_SYSTEM = `你是一位学习路径规划专家。你的任务是将学习目标分解为子节点。

【分解终止标准】——满足以下任一条件，则标记 isLeaf: true，不再进一步拆分：
1. 该节点是单一概念或术语（例如"REST 架构风格"、"TCP/IP 三次握手"）
2. 该节点是一个具体可操作步骤（例如"用 Postman 发起 GET 请求"、"部署一个 Hello World 到 Vercel"）
3. 预估学习时长 ≤ 30 分钟
4. 再拆会引入与父节点重复的内容

【节点类型说明】
- objective：还需继续分解的大目标
- topic：某个主题领域，可能需要进一步拆分
- concept：单一概念/理论知识点，通常是叶子节点
- action：具体操作步骤，是叶子节点

【输出要求】
- 每个父节点拆分为 3-6 个子节点
- 子节点之间有清晰的学习顺序（先基础后应用）
- 预估时间要合理（concept 通常 15-25 分钟，action 20-30 分钟）

严格返回 JSON：
{
  "nodes": [
    {
      "title": "子节点标题",
      "summary": "简短说明（1-2句话）",
      "kind": "concept | action | topic | objective",
      "isLeaf": true | false,
      "estimatedMinutes": 20,
      "order": 1
    }
  ]
}`;

export function buildDecomposePrompt(
  nodeTitle: string,
  nodeKind: string,
  parentContext: string,
  clarification?: string
): string {
  const context = clarification ? `\n用户背景：${clarification}` : "";
  return `请将以下学习节点分解为子节点：

父节点：「${nodeTitle}」（类型：${nodeKind}）
上下文：${parentContext}${context}

请按照终止标准判断每个子节点是否为叶子节点。`;
}

export function buildFirstLevelPrompt(
  goalTitle: string,
  clarification: string
): string {
  return `请为以下学习目标制定一级学习路径（直接子节点）：

学习目标：「${goalTitle}」
用户信息：${clarification}

一级节点应该是清晰的学习领域划分，通常 4-8 个。每个一级节点都需要进一步分解（isLeaf: false）。`;
}
