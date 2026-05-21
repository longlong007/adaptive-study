"use client";

import { useState } from "react";
import NextImage from "next/image";

interface Props {
  url?: string;
  prompt?: string;
  alt?: string;
}

export function ImageRenderer({ url, prompt, alt }: Props) {
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(url);

  async function generate() {
    if (!prompt) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setImageUrl(data.url);
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  }

  if (!imageUrl) {
    return (
      <div className="my-4 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
        <div className="text-4xl mb-2">🖼️</div>
        <p className="text-sm text-gray-500 mb-3">
          {alt ?? "配图"}
        </p>
        {prompt && (
          <button
            onClick={generate}
            disabled={generating}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {generating ? "生成中…" : "生成配图"}
          </button>
        )}
      </div>
    );
  }

  return (
    <figure className="my-4">
      <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: "16/9" }}>
        <NextImage
          src={imageUrl}
          alt={alt ?? "学习配图"}
          fill
          className="object-contain"
        />
      </div>
      {alt && (
        <figcaption className="mt-2 text-center text-sm text-gray-500">{alt}</figcaption>
      )}
    </figure>
  );
}
