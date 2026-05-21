export interface Msg {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOpts {
  system?: string;
  messages: Msg[];
  json?: boolean;
}

export interface LLMProvider {
  chat(opts: ChatOpts): Promise<string>;
  chatStream(opts: ChatOpts): AsyncIterable<string>;
  generateImage?(prompt: string): Promise<string>;
}

let _provider: LLMProvider | null = null;

export async function getLLM(): Promise<LLMProvider> {
  if (_provider) return _provider;

  const name = process.env.LLM_PROVIDER ?? "mock";

  if (name === "openai") {
    const { OpenAIProvider } = await import("./openai");
    _provider = new OpenAIProvider();
  } else if (name === "deepseek") {
    const { DeepSeekProvider } = await import("./deepseek");
    _provider = new DeepSeekProvider();
  } else {
    const { MockProvider } = await import("./mock");
    _provider = new MockProvider();
  }

  return _provider;
}
