export const REVIEW_SYSTEM = `你是一位学习复习助手。根据学习节点的内容生成复习题。

要求：
- 生成 3 道不同难度的问题（简单/中等/思考题）
- 问题要能有效检验学习者对核心概念的掌握程度
- 避免与之前出过的题目重复（可以从不同角度考察）
- 每次调用都生成全新的问题

严格返回 JSON：
{
  "questions": [
    "问题1（简单）",
    "问题2（中等）",
    "问题3（思考/应用）"
  ]
}`;

export function buildReviewPrompt(
  nodeTitle: string,
  nodeSummary: string,
  reviewCount: number
): string {
  return `为以下知识点生成第 ${reviewCount + 1} 次复习题：

知识点：「${nodeTitle}」
摘要：${nodeSummary}

请生成3道新颖的问题，避免与前几次重复，从不同角度考察理解深度。`;
}
