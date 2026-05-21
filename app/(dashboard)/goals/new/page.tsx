"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, ArrowRight, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NewGoalPage() {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "clarify" | "creating">("input");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalId, setGoalId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ role: string; content: string }>>([]);

  async function startClarify() {
    if (!goalTitle.trim()) return;
    setLoading(true);

    try {
      // Create goal first
      const goalRes = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: goalTitle.trim() }),
      });
      const goal = await goalRes.json();
      setGoalId(goal.id);

      // Start clarification
      const clarifyRes = await fetch(`/api/goals/${goal.id}/clarify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: [] }),
      });
      const data = await clarifyRes.json();

      if (data.phase === "done") {
        await generateFirstLevel(goal.id);
        return;
      }

      const newHistory = [{ role: "assistant", content: data.assistantMessage }];
      setHistory(newHistory);
      setMessages([{ role: "assistant", content: data.question }]);
      setStep("clarify");
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    if (!input.trim() || !goalId) return;
    const reply = input.trim();
    setInput("");
    setLoading(true);

    const newMessages: Message[] = [...messages, { role: "user", content: reply }];
    setMessages(newMessages);

    try {
      const newHistory = [...history, { role: "user", content: reply }];

      const res = await fetch(`/api/goals/${goalId}/clarify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userReply: reply, history: newHistory }),
      });
      const data = await res.json();

      const updatedHistory = [...newHistory, { role: "assistant", content: data.assistantMessage }];
      setHistory(updatedHistory);

      if (data.phase === "done") {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: "太好了！我已经了解了你的学习需求，现在为你生成个性化学习路径…",
          },
        ]);
        await generateFirstLevel(goalId);
      } else {
        setMessages([...newMessages, { role: "assistant", content: data.question }]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function generateFirstLevel(id: string) {
    setStep("creating");
    await fetch("/api/nodes/decompose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: id }),
    });
    router.push(`/goals/${id}`);
  }

  async function skipClarify() {
    if (!goalId) return;
    await generateFirstLevel(goalId);
  }

  if (step === "input") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">你想学什么？</h1>
          <p className="text-gray-500 mt-2">输入你的学习目标，AI 将帮你梳理需求、制定个性化路径</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                学习目标
              </label>
              <Textarea
                placeholder="例如：AI 新时代的程序员转型学习路径：软件产品思维，设计思维，软件开发技能，测试技能，运维技能，商业化技能"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="min-h-[100px] resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) startClarify();
                }}
              />
              <p className="text-xs text-gray-400 mt-1">Cmd+Enter 快速开始</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startClarify}
                disabled={!goalTitle.trim() || loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                开始梳理需求
              </button>
            </div>
          </div>
        </div>

        {/* Suggested goals */}
        <div className="mt-6">
          <p className="text-xs text-gray-400 mb-3">快速开始</p>
          <div className="flex flex-wrap gap-2">
            {[
              "AI 新时代的程序员转型",
              "学习 React 开发",
              "掌握机器学习基础",
              "Python 数据分析入门",
            ].map((title) => (
              <button
                key={title}
                onClick={() => setGoalTitle(title)}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-violet-300 hover:text-violet-600 transition-colors"
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === "creating") {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">正在生成个性化学习路径…</h2>
        <p className="text-sm text-gray-400 mt-2">AI 正在为你分解目标，请稍候</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">需求梳理</h1>
        <p className="text-sm text-gray-500">目标：{goalTitle}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 min-h-[400px] flex flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的回复…"
              className="min-h-[60px] resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendReply();
                }
              }}
            />
            <button
              onClick={sendReply}
              disabled={!input.trim() || loading}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors shrink-0 self-end"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={skipClarify}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowRight className="w-3 h-3" />
            跳过，直接生成学习路径
          </button>
        </div>
      </div>
    </div>
  );
}
