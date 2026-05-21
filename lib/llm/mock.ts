import type { ChatOpts, LLMProvider } from "./index";

const MOCK_DECOMPOSE = JSON.stringify({
  nodes: [
    {
      title: "MVP 概念与产品思维",
      summary: "理解最小可行产品的核心理念，学会快速验证假设",
      kind: "concept",
      isLeaf: true,
      estimatedMinutes: 20,
    },
    {
      title: "用户访谈方法",
      summary: "掌握结构化用户访谈技巧，收集有价值的需求洞察",
      kind: "concept",
      isLeaf: true,
      estimatedMinutes: 25,
    },
    {
      title: "需求优先级排序（RICE 框架）",
      summary: "使用 RICE 分析对功能需求进行优先级排序",
      kind: "action",
      isLeaf: true,
      estimatedMinutes: 20,
    },
  ],
});

const MOCK_CLARIFY_Q = JSON.stringify({
  phase: "questioning",
  question:
    "请问您目前的编程背景是什么？（例如：前端、后端、全栈、还是其他方向）您希望在多长时间内完成这个学习目标？",
  fields: ["currentLevel", "weeklyHours"],
});

const MOCK_CLARIFY_DONE = JSON.stringify({
  phase: "done",
  clarification: {
    currentLevel: "有一定编程基础的程序员",
    weeklyHours: 10,
    priorities: ["软件产品思维", "设计思维"],
    expectedOutcome: "能独立完成 AI 时代的产品从 0 到 1",
    deadline: "6 个月",
  },
});

const MOCK_CONTENT = JSON.stringify({
  blocks: [
    {
      kind: "markdown",
      payload: {
        content:
          "## MVP（最小可行产品）\n\n**MVP** 是指具备足够功能可以吸引早期客户，并用于验证产品概念的产品版本。\n\n### 核心理念\n\n- **快速验证**：用最小代价测试核心假设\n- **学习导向**：每次迭代都要有可量化的学习\n- **以用户为中心**：解决真实痛点，而非追求完美功能\n\n### 经典案例\n\n| 产品 | MVP 形式 |\n|------|----------|\n| Dropbox | 演示视频 |\n| Airbnb | 手工运营的简陋网站 |\n| Zappos | 先销售、后采购 |",
      },
    },
    {
      kind: "mermaid",
      payload: {
        code: "flowchart LR\n  Idea --> Build\n  Build --> Measure\n  Measure --> Learn\n  Learn --> Idea",
        caption: "MVP 迭代循环（Build-Measure-Learn）",
      },
    },
    {
      kind: "markdown",
      payload: {
        content:
          "### 自检题\n\n1. MVP 的核心目的是什么？\n2. 举一个你熟悉领域的 MVP 例子\n3. MVP 和原型（Prototype）有什么区别？",
      },
    },
  ],
});

const MOCK_REVIEW = JSON.stringify({
  questions: [
    "用一句话描述 MVP 的核心目的是什么？",
    "Build-Measure-Learn 循环中，'Learn' 阶段的输出是什么？",
    "为什么 Dropbox 用视频作为 MVP 而不是直接开发产品？",
  ],
});

const MOCK_FIRST_LEVEL = JSON.stringify({
  nodes: [
    {
      title: "软件产品思维",
      summary: "学会像产品经理一样思考，理解用户需求，制定产品策略",
      kind: "objective",
      isLeaf: false,
      estimatedMinutes: 300,
    },
    {
      title: "设计思维",
      summary: "掌握以用户为中心的设计方法，打造优秀的用户体验",
      kind: "objective",
      isLeaf: false,
      estimatedMinutes: 240,
    },
    {
      title: "AI 辅助软件开发技能",
      summary: "用 AI 工具提升编码效率，掌握现代全栈开发实践",
      kind: "objective",
      isLeaf: false,
      estimatedMinutes: 480,
    },
    {
      title: "AI 时代的测试技能",
      summary: "理解测试策略，学会使用 AI 生成测试用例，保障软件质量",
      kind: "objective",
      isLeaf: false,
      estimatedMinutes: 240,
    },
    {
      title: "现代运维技能（DevOps/云原生）",
      summary: "掌握 CI/CD、容器化、云部署，从开发到上线一人搞定",
      kind: "objective",
      isLeaf: false,
      estimatedMinutes: 360,
    },
    {
      title: "商业化与变现技能",
      summary: "理解商业模式、定价策略、增长黑客，让产品产生价值",
      kind: "objective",
      isLeaf: false,
      estimatedMinutes: 200,
    },
  ],
});

export class MockProvider implements LLMProvider {
  async chat({ messages }: ChatOpts): Promise<string> {
    const lastMsg = messages[messages.length - 1]?.content ?? "";

    if (lastMsg.includes("decompose") || lastMsg.includes("分解") || lastMsg.includes("子节点")) {
      if (lastMsg.includes("一级") || lastMsg.includes("first level") || lastMsg.includes("顶级")) {
        return MOCK_FIRST_LEVEL;
      }
      return MOCK_DECOMPOSE;
    }
    if (lastMsg.includes("content") || lastMsg.includes("学习内容")) {
      return MOCK_CONTENT;
    }
    if (lastMsg.includes("review") || lastMsg.includes("复习题")) {
      return MOCK_REVIEW;
    }
    if (lastMsg.includes("clarify") || lastMsg.includes("梳理") || lastMsg.includes("需求")) {
      if (messages.length > 3) return MOCK_CLARIFY_DONE;
      return MOCK_CLARIFY_Q;
    }
    return JSON.stringify({ message: "Mock response for: " + lastMsg.slice(0, 50) });
  }

  async *chatStream({ messages }: ChatOpts): AsyncIterable<string> {
    const result = await this.chat({ messages });
    const words = result.split(" ");
    for (const word of words) {
      yield word + " ";
      await new Promise((r) => setTimeout(r, 10));
    }
  }
}
