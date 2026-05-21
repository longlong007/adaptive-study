export type Grade = "forgot" | "vague" | "fluent";

export interface ReviewItemState {
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
}

const INITIAL_INTERVALS = [1, 2, 4, 7, 15, 30];

export function nextInterval(
  item: ReviewItemState,
  grade: Grade
): { intervalDays: number; easeFactor: number } {
  if (grade === "forgot") {
    return {
      intervalDays: 1,
      easeFactor: Math.max(1.3, item.easeFactor - 0.2),
    };
  }
  if (grade === "vague") {
    return {
      intervalDays: Math.max(1, item.intervalDays),
      easeFactor: item.easeFactor,
    };
  }
  // fluent
  const idx = item.reviewCount;
  const base =
    INITIAL_INTERVALS[idx] ??
    Math.round(item.intervalDays * item.easeFactor);
  return {
    intervalDays: base,
    easeFactor: Math.min(2.8, item.easeFactor + 0.05),
  };
}

export function nextReviewDate(intervalDays: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + intervalDays);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function isDueToday(nextReviewAt: Date): boolean {
  const now = new Date();
  return nextReviewAt <= now;
}
