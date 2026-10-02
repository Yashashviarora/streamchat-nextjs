# StreamChat — Streaming AI Chat

StreamChat is a minimal chat app that streams answers from an LLM token by token. It is built with the Next.js App Router, TypeScript and Tailwind CSS, talks to any OpenAI-compatible API through the `openai` SDK, and runs the chat endpoint on the Vercel Edge runtime. Responses can be stopped mid-stream, assistant replies are rendered as Markdown, and the conversation is kept in `localStorage` so it survives a refresh.

**Live:** https://streamchat-nextjs.vercel.app

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- OpenAI-compatible API (Groq by default, via the `openai` SDK)
- GitHub Actions CI (lint, type-check, build)
- Vercel

## Features

- Token-by-token streaming responses (Edge runtime + `ReadableStream`)
- Two modes: **Chat** (helpful assistant) and **Summarise** (3–5 bullet points)
- Stop button to abort a response mid-stream (`AbortController`)
- Markdown rendering of assistant replies (`react-markdown`)
- Conversation persisted to `localStorage` (survives page refresh)
- Input validation: rejects empty message lists (400) and messages over 4000 chars (413)
- Only the last 10 messages are sent as context to bound token usage

## Local setup

Requires Node.js 20+.

```bash
git clone https://github.com/Yashashviarora/streamchat-nextjs.git
cd streamchat-nextjs
npm install
```

Create `.env.local` in the project root with the required environment variables:

| Variable | Required | Description |
|---|---|---|
| `LLM_API_KEY` | yes | API key for your LLM provider |
| `LLM_BASE_URL` | yes | Base URL of an OpenAI-compatible API |
| `LLM_MODEL` | yes | Model name to send requests to |

Example (Groq):

```
LLM_API_KEY=your_key_here
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-20b
```

Then start the dev server:

```bash
npm run dev
```

Open http://localhost:3000.

### Checks

The same checks CI runs on every push:

```bash
npm run lint
npx next typegen && npx tsc --noEmit
npm run build
```

## Switching providers

The API route uses the `openai` SDK, which works with any OpenAI-compatible API. Switch providers by changing env vars only — no code changes:

| Provider | LLM_BASE_URL | LLM_MODEL (example) |
|---|---|---|
| Groq | `https://api.groq.com/openai/v1` | `openai/gpt-oss-20b` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |

Set `LLM_API_KEY` to the matching provider's key and restart the dev server.

## Deploying on Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com), click **Add New → Project** and import the repo (Next.js is auto-detected).
3. Under **Settings → Environment Variables**, add `LLM_API_KEY`, `LLM_BASE_URL`, and `LLM_MODEL`.
4. Deploy. `.env.local` is never committed; production reads the variables from Vercel's dashboard.

## What I'd improve

- **Auth** — user accounts so conversations are private per user
- **DB-backed history** — store chats in a database instead of localStorage
- **Rate limiting** — Redis-based per-user limits to protect the API key from abuse
- **RAG** — a vector store over uploaded documents so answers can cite real sources
