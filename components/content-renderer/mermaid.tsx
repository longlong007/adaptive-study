"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  code: string;
  caption?: string;
}

export function MermaidRenderer({ code, caption }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "loose",
        });

        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, code);

        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
        图表渲染失败：{error}
        <pre className="mt-2 text-xs text-gray-500">{code}</pre>
      </div>
    );
  }

  return (
    <figure className="my-4 flex flex-col items-center">
      <div
        ref={ref}
        className="w-full overflow-x-auto rounded-lg bg-gray-50 p-4"
      />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
