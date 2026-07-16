type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatCompletionResponse = {
  choices?: { message?: { content?: string } }[];
};

export async function completeText(messages: ChatMessage[], maxTokens = 300) {
  const proxyUrl = process.env.AI_PROXY_URL;
  const proxyKey = process.env.AI_PROXY_API_KEY;
  if (!proxyUrl || !proxyKey) return null;

  try {
    const response = await fetch(`${proxyUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${proxyKey}` },
      body: JSON.stringify({ model: process.env.AI_MODEL ?? 'qwen2.5:3b', messages, max_tokens: maxTokens, temperature: 0.2 }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;
    const data = await response.json() as ChatCompletionResponse;
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export function parseJsonObject<T>(value: string | null) {
  if (!value) return null;
  const json = value.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
