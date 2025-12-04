"use client"; // REQUIRED for interactivity

import { useState } from "react";

export default function CourtroomPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([
    { role: "Judge", content: "Court is in session. Present your opening statement." }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Add User Message
    const userMsg = { role: "You", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setInput("");

    // 2. Call Backend
    try {
      const res = await fetch("http://localhost:8000/api/simulation/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_argument: input,
          case_context: "Theft under Section 378 IPC" // Default context for now
        }),
      });
      const data = await res.json();
      
      // 3. Add AI Response
      setMessages((prev) => [...prev, { role: "AI Court", content: data.response }]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      {/* ... Keep your Header ... */}
      
      <section className="grid flex-1 gap-4 px-4 py-4 md:grid-cols-[2fr,1.2fr]">
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3 text-xs">
            {messages.map((msg, i) => (
              <div key={i} className={`rounded-lg px-3 py-2 ${msg.role === 'You' ? 'bg-slate-800/80 text-sky-300' : 'bg-slate-900/80 text-amber-300'}`}>
                <span className="font-semibold block mb-1">{msg.role}:</span>
                {msg.content}
              </div>
            ))}
            {loading && <div className="text-slate-500 px-3">AI is deliberating...</div>}
          </div>
          
          <form onSubmit={handleSend} className="border-t border-slate-800 p-3 text-xs">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="mb-2 h-20 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 outline-none focus:border-sky-500"
              placeholder="Your argument..."
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-sky-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Send to AI Agents"}
            </button>
          </form>
        </div>
        {/* ... Keep your Sidebar ... */}
      </section>
    </main>
  );
}

