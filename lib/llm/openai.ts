import type { ChatOpts, LLMProvider, Msg } from "./index";

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY ?? "";
    this.baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
    this.model = process.env.OPENAI_MODEL ?? "gpt-4o";
  }

  async chat({ system, messages, json }: ChatOpts): Promise<string> {
    const msgs: Msg[] = system
      ? [{ role: "system", content: system }, ...messages]
      : messages;

    const body: Record<string, unknown> = {
      model: this.model,
      messages: msgs,
    };
    if (json) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return data.choices[0].message.content ?? "";
  }

  async *chatStream({ system, messages }: ChatOpts): AsyncIterable<string> {
    const msgs: Msg[] = system
      ? [{ role: "system", content: system }, ...messages]
      : messages;

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, messages: msgs, stream: true }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`OpenAI stream error ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const raw = line.slice(6);
        if (raw === "[DONE]") return;
        try {
          const parsed = JSON.parse(raw);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // skip malformed
        }
      }
    }
  }

  async generateImage(prompt: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024" }),
    });

    if (!res.ok) throw new Error(`OpenAI image error ${res.status}`);
    const data = await res.json();
    return data.data[0].url;
  }
}
