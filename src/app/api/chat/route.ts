import OpenAI from 'openai';

export const runtime = 'edge';

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
});

type Msg = { role: 'user' | 'assistant'; content: string };

export async function POST(req: Request) {
  const { messages, mode } = await req.json().catch(() => ({} as never));

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages must be a non-empty array', { status: 400 });
  }
  if (messages.some((m: Msg) => typeof m.content !== 'string' || m.content.length > 4000)) {
    return new Response('message content too long (max 4000 chars)', { status: 413 });
  }

  const system =
    mode === 'summarise'
      ? 'You are a concise summariser. Return 3–5 bullet points, no preamble.'
      : 'You are a helpful assistant. Answer clearly and briefly.';

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const completion = await client.chat.completions.create({
          model: process.env.LLM_MODEL ?? '',
          messages: [{ role: 'system', content: system }, ...messages.slice(-10)],
          temperature: 0.3,
          stream: true,
        });
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown error';
        controller.enqueue(encoder.encode(`[error: ${msg}]`));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
