"use client";

import { MarkdownRenderer } from "./markdown";
import { MermaidRenderer } from "./mermaid";
import { ImageRenderer } from "./image";
import { SlideRenderer } from "./slide";
import { ThreeRenderer } from "./three";

export interface ContentBlock {
  id: string;
  kind: string;
  payload: string; // JSON string
  order: number;
}

interface Props {
  blocks: ContentBlock[];
}

export function ContentRenderer({ blocks }: Props) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        let payload: Record<string, string> = {};
        try {
          payload = JSON.parse(block.payload);
        } catch {
          // use empty
        }

        switch (block.kind) {
          case "markdown":
            return (
              <div key={block.id}>
                <MarkdownRenderer content={payload.content ?? ""} />
              </div>
            );
          case "mermaid":
            return (
              <MermaidRenderer
                key={block.id}
                code={payload.code ?? ""}
                caption={payload.caption}
              />
            );
          case "image":
            return (
              <ImageRenderer
                key={block.id}
                url={payload.url}
                prompt={payload.prompt}
                alt={payload.alt}
              />
            );
          case "slide":
            return <SlideRenderer key={block.id} />;
          case "three":
            return <ThreeRenderer key={block.id} />;
          default:
            return (
              <div key={block.id} className="text-sm text-gray-400">
                未知内容类型：{block.kind}
              </div>
            );
        }
      })}
    </div>
  );
}
