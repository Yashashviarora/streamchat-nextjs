# AskDocs

A minimal chat UI that streams answers from an LLM, built with Next.js (App Router), TypeScript, and Tailwind CSS. Messages stream token-by-token from the model into the browser, with a chat mode and a summarise mode.

## Features

- Token-by-token streaming responses (Edge runtime + `ReadableStream`)
- Two modes: **Chat** (helpful assistant) and **Summarise** (3–5 bullet points)
- Stop button to abort a response mid-stream (`AbortController`)
- Markdown rendering of assistant replies (`react-markdown`)
- Conversation persisted to `localStorage` (survives page refresh)
- Input validation: rejects empty message lists (400) and messages over 4000 chars (413)
- Only the last 10 messages are sent as context to bound token usage

## Local setup

```bash
npm install
```

Create `.env.local` in the project root:

```
LLM_API_KEY=your_key_here
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-20b
```

Then:

```bash
npm run dev
```

Open http://localhost:3000.

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
- **RAG** — a vector store over uploaded documents so answers can cite real sources ("ask your docs" for real)
