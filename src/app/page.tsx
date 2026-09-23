'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'chat' | 'summarise'>('chat');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('askdocs-messages');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load from localStorage
      if (saved) setMessages(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('askdocs-messages', JSON.stringify(messages));
    } catch {}
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function appendToLast(chunk: string) {
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      copy[copy.length - 1] = { ...last, content: last.content + chunk };
      return copy;
    });
  }

  function autoResize() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const history = [...messages, { role: 'user', content: text } as Msg];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    requestAnimationFrame(autoResize);
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, mode }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        appendToLast(decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        appendToLast(`[error: ${err instanceof Error ? err.message : 'request failed'}]`);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-2xl flex-col px-4 py-3 sm:px-6">
      <header className="flex items-center border-b border-gray-200 pb-3 dark:border-gray-800">
        <h1 className="text-base font-semibold sm:text-lg">AskDocs</h1>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-gray-400 dark:text-gray-500">
            Start a conversation…
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm sm:max-w-[80%] sm:text-base ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              }`}
            >
              {m.role === 'assistant' ? (
                <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="rounded-2xl border border-gray-300 bg-white p-2 shadow-sm focus-within:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-blue-500">
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            autoResize();
          }}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Type a message…"
          className="max-h-[200px] w-full resize-none bg-transparent px-2 py-2 text-sm outline-none sm:text-base"
        />
        <div className="flex items-center justify-between pt-1">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'chat' | 'summarise')}
            className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="chat">Chat</option>
            <option value="summarise">Summarise</option>
          </select>
          {loading ? (
            <button
              onClick={() => abortRef.current?.abort()}
              aria-label="Stop"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500"
            >
              ■
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!input.trim()}
              aria-label="Send"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-lg text-white hover:bg-blue-500 disabled:opacity-40"
            >
              ↑
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
