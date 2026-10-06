"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Hash, Plus, Send } from "lucide-react";
import type { Channel, Message, User } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/Toast";

const time = (iso: string) => new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const day = (iso: string) => new Date(iso.endsWith("Z") ? iso : iso + "Z").toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });

export function Discuss({ user }: { user: User }) {
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const me = `${user.firstName} ${user.lastName}`.trim();

  useEffect(() => {
    api<{ channels: Channel[] }>("/discuss/channels").then((r) => { setChannels(r.channels); setActive((a) => a ?? r.channels[0]?.id ?? null); }).catch((e: ApiError) => toast(e.message, "error"));
  }, [toast]);

  useEffect(() => {
    if (active == null) return;
    let alive = true;
    api<{ messages: Message[] }>(`/discuss/channels/${active}/messages`).then((r) => { if (alive) setMessages(r.messages); }).catch((e: ApiError) => toast(e.message, "error"));
    return () => { alive = false; };
  }, [active, toast]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || active == null) return;
    setText("");
    const optimistic: Message = { id: -Date.now(), channelId: active, author: me, body, isBot: false, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    try {
      const r = await api<{ message: Message; extra: Message[] }>(`/discuss/channels/${active}/messages`, { body: { body } });
      setMessages((m) => [...m.filter((x) => x.id !== optimistic.id), r.message, ...r.extra]);
      setChannels((cs) => cs.map((c) => (c.id === active ? { ...c, messageCount: c.messageCount + 1 + r.extra.length, lastMessageAt: r.message.createdAt } : c)));
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      toast((err as ApiError).message, "error");
    }
  }

  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const r = await api<{ channel: Channel }>("/discuss/channels", { body: { name: newName } });
      setChannels((c) => [...c, r.channel]);
      setActive(r.channel.id);
      setNewName(""); setCreating(false);
    } catch (err) { toast((err as ApiError).message, "error"); }
  }

  const current = channels.find((c) => c.id === active);
  let lastDay = "";

  return (
    <div className="-my-8 flex h-[calc(100vh-4rem)] overflow-hidden rounded-none border-line sm:-mx-0 sm:my-0 sm:h-[calc(100vh-8rem)] sm:rounded-2xl sm:border sm:bg-white sm:shadow-soft">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface/60 sm:flex">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-mist">Channels</h2>
          <button onClick={() => setCreating((v) => !v)} className="rounded-md p-1 text-mist hover:bg-primary-soft hover:text-primary" aria-label="New channel"><Plus className="size-4" /></button>
        </div>
        {creating && (
          <form onSubmit={createChannel} className="px-3 pb-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="channel-name" autoFocus className="field !py-1.5 text-sm" onKeyDown={(e) => e.key === "Escape" && setCreating(false)} />
          </form>
        )}
        <nav className="flex-1 overflow-y-auto px-2">
          {channels.map((c) => (
            <button key={c.id} onClick={() => setActive(c.id)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${c.id === active ? "bg-primary text-white" : "text-ink hover:bg-primary-soft"}`}>
              <Hash className="size-4 shrink-0 opacity-70" /><span className="flex-1 truncate">{c.name}</span>
              {c.messageCount > 0 && <span className={`text-[10px] tabular-nums ${c.id === active ? "text-white/80" : "text-mist"}`}>{c.messageCount}</span>}
            </button>
          ))}
        </nav>
        <div className="border-t border-line p-3 text-xs text-slate">Signed in as <span className="font-semibold text-ink">{me}</span></div>
      </aside>

      {/* Thread */}
      <section className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex items-center gap-2 border-b border-line px-4 py-3">
          <select value={active ?? ""} onChange={(e) => setActive(Number(e.target.value))} className="field !w-auto !py-1.5 text-sm sm:hidden">
            {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
          </select>
          <Hash className="hidden size-5 text-mist sm:block" />
          <div className="hidden min-w-0 sm:block">
            <h1 className="truncate text-base font-bold text-ink">{current?.name ?? "…"}</h1>
            {current?.description && <p className="truncate text-xs text-slate">{current.description}</p>}
          </div>
        </header>

        <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const d = day(m.createdAt);
              const showDay = d !== lastDay; lastDay = d;
              const mine = !m.isBot && m.author === me;
              return (
                <div key={m.id}>
                  {showDay && <p className="my-3 text-center text-[11px] font-medium uppercase tracking-wider text-mist">{d}</p>}
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                    <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${m.isBot ? "bg-midnight" : mine ? "bg-gradient-to-br from-primary to-accent" : "bg-slate"}`}>
                      {m.isBot ? <Bot className="size-4" /> : m.author.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
                      <p className="text-[11px] text-mist"><span className="font-semibold text-slate">{m.author}</span> · {time(m.createdAt)}</p>
                      <p className={`mt-0.5 whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${mine ? "rounded-tr-sm bg-primary text-white" : "rounded-tl-sm bg-surface text-ink"}`}>{m.body}</p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
          <div ref={bottom} />
        </div>

        <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3">
          <textarea
            value={text} onChange={(e) => setText(e.target.value)} rows={1} placeholder={current ? `Message #${current.name}` : "Message"}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }}
            className="field max-h-40 min-h-[42px] flex-1 resize-none"
          />
          <button type="submit" disabled={!text.trim()} className="btn-primary !px-3.5 !py-2.5" aria-label="Send"><Send className="size-4" /></button>
        </form>
      </section>
    </div>
  );
}
