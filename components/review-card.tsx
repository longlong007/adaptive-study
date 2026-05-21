"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, HelpCircle, XCircle, Loader2 } from "lucide-react";

interface ReviewItem {
  id: string;
  intervalDays: number;
  reviewCount: number;
  nextReviewAt: string;
  node: {
    id: string;
    title: string;
    summary?: string | null;
    goal: { title: string };
  };
}

interface Props {
  item: ReviewItem;
  questions: string[];
  onGraded: (grade: "forgot" | "vague" | "fluent") => void;
}

export function ReviewCard({ item, questions, onGraded }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [grading, setGrading] = useState(false);

  async function grade(g: "forgot" | "vague" | "fluent") {
    setGrading(true);
    try {
      await fetch(`/api/reviews/${item.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: g }),
      });
      onGraded(g);
    } finally {
      setGrading(false);
    }
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg leading-tight">{item.node.title}</CardTitle>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {item.node.goal.title}
          </Badge>
        </div>
        {item.node.summary && (
          <p className="text-sm text-gray-500 mt-1">{item.node.summary}</p>
        )}
        <p className="text-xs text-gray-400">第 {item.reviewCount + 1} 次复习</p>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 text-xs font-bold text-violet-600 mt-0.5">Q{i + 1}</span>
              <p className="text-sm text-gray-700">{q}</p>
            </div>
          ))}
        </div>

        {!revealed && (
          <button
            onClick={() => setRevealed(true)}
            className="mt-4 w-full rounded-lg border border-dashed border-gray-200 py-3 text-sm text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors"
          >
            思考后点击评估掌握程度
          </button>
        )}
      </CardContent>

      {revealed && (
        <CardFooter className="flex gap-2 pt-0">
          <button
            onClick={() => grade("forgot")}
            disabled={grading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            忘了
          </button>
          <button
            onClick={() => grade("vague")}
            disabled={grading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-yellow-100 bg-yellow-50 py-2.5 text-sm font-medium text-yellow-600 hover:bg-yellow-100 disabled:opacity-50 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            模糊
          </button>
          <button
            onClick={() => grade("fluent")}
            disabled={grading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-green-100 bg-green-50 py-2.5 text-sm font-medium text-green-600 hover:bg-green-100 disabled:opacity-50 transition-colors"
          >
            {grading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            流利
          </button>
        </CardFooter>
      )}
    </Card>
  );
}
