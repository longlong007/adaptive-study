import { prisma } from "@/lib/db";
import { getLLM } from "@/lib/llm";
import { parseQuestionList } from "@/lib/llm/parse";
import { REVIEW_SYSTEM, buildReviewPrompt } from "@/lib/prompts/review";
import { ReviewPageClient } from "./review-client";

async function getDueItemsWithQuestions() {
  const now = new Date();
  const dueItems = await prisma.reviewItem.findMany({
    where: { nextReviewAt: { lte: now } },
    include: {
      node: { include: { goal: true } },
    },
    orderBy: { nextReviewAt: "asc" },
    take: 10,
  });

  const upcoming = await prisma.reviewItem.findMany({
    where: { nextReviewAt: { gt: now } },
    include: {
      node: { include: { goal: true } },
    },
    orderBy: { nextReviewAt: "asc" },
    take: 5,
  });

  // Generate questions for the first due item only to save API calls
  const llm = await getLLM();
  const itemsWithQuestions = await Promise.all(
    dueItems.map(async (item) => {
      const prompt = buildReviewPrompt(
        item.node.title,
        item.node.summary ?? "",
        item.reviewCount
      );
      try {
        const raw = await llm.chat({
          system: REVIEW_SYSTEM,
          messages: [{ role: "user", content: prompt }],
          json: true,
        });
        const questions = parseQuestionList(raw);
        if (questions && questions.length > 0) {
          return { item, questions };
        }
      } catch {
        // fall through to defaults
      }
      return {
        item,
        questions: [
          "回忆一下这个知识点的核心概念",
          "举一个实际应用的例子",
          "如何将这个知识点应用到实际工作中？",
        ],
      };
    })
  );

  return { itemsWithQuestions, upcoming };
}

export default async function ReviewsPage() {
  const { itemsWithQuestions, upcoming } = await getDueItemsWithQuestions();

  const serialized = itemsWithQuestions.map(({ item, questions }) => ({
    item: {
      id: item.id,
      intervalDays: item.intervalDays,
      reviewCount: item.reviewCount,
      nextReviewAt: item.nextReviewAt.toISOString(),
      node: {
        id: item.node.id,
        title: item.node.title,
        summary: item.node.summary,
        goal: { title: item.node.goal.title },
      },
    },
    questions,
  }));

  const serializedUpcoming = upcoming.map((item) => ({
    id: item.id,
    nextReviewAt: item.nextReviewAt.toISOString(),
    intervalDays: item.intervalDays,
    node: {
      title: item.node.title,
      goal: { title: item.node.goal.title },
    },
  }));

  return (
    <ReviewPageClient
      initialItems={serialized}
      upcoming={serializedUpcoming}
    />
  );
}
