"use client";

import { useState, useEffect } from "react";
import { ReviewCard } from "@/components/review-card";
import { RefreshCw, CheckCircle2, Calendar, Bell } from "lucide-react";

interface ReviewItemData {
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

interface UpcomingItem {
  id: string;
  nextReviewAt: string;
  intervalDays: number;
  node: { title: string; goal: { title: string } };
}

interface Props {
  initialItems: Array<{ item: ReviewItemData; questions: string[] }>;
  upcoming: UpcomingItem[];
}

export function ReviewPageClient({ initialItems, upcoming }: Props) {
  const [items, setItems] = useState(initialItems);
  const [gradedIds, setGradedIds] = useState<Set<string>>(new Set());
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotifGranted(Notification.permission === "granted");
    }
  }, []);

  async function requestNotif() {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifGranted(perm === "granted");
    if (perm === "granted") {
      new Notification("自适应学习", {
        body: "通知已开启！复习到期时我们会提醒你。",
        icon: "/favicon.ico",
      });
    }
  }

  function handleGraded(itemId: string) {
    setGradedIds((prev) => new Set([...prev, itemId]));
  }

  const pendingItems = items.filter(({ item }) => !gradedIds.has(item.id));
  const allDone = items.length > 0 && pendingItems.length === 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">今日复习</h1>
          <p className="text-sm text-gray-500 mt-1">
            {items.length > 0
              ? `共 ${items.length} 个知识点待复习`
              : "今天没有待复习内容"}
          </p>
        </div>
        {!notifGranted && (
          <button
            onClick={requestNotif}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            开启提醒
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="font-semibold text-gray-700 mb-2">今天没有复习任务</h3>
          <p className="text-sm text-gray-400">完成更多学习节点后，复习任务会自动添加到这里</p>
        </div>
      ) : allDone ? (
        <div className="rounded-xl bg-green-50 border border-green-100 p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-green-800 mb-1">今日复习完成！</h3>
          <p className="text-sm text-green-600">下次复习时间已根据你的掌握情况自动安排</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingItems.map(({ item, questions }) => (
            <ReviewCard
              key={item.id}
              item={item}
              questions={questions}
              onGraded={() => handleGraded(item.id)}
            />
          ))}
          <p className="text-xs text-center text-gray-400">
            已完成 {gradedIds.size}/{items.length}
          </p>
        </div>
      )}

      {/* Upcoming reviews */}
      {upcoming.length > 0 && (
        <div className="mt-8">
          <h2 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            即将到期
          </h2>
          <div className="space-y-2">
            {upcoming.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.node.title}</p>
                  <p className="text-xs text-gray-400">{item.node.goal.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(item.nextReviewAt).toLocaleDateString("zh-CN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-gray-400">+{item.intervalDays}天</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
