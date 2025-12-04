"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Define message type for TypeScript
type Message = {
  role: "You" | "AI Judge" | "AI Opposing Counsel" | "System";
  content: string;
};

export default function CourtroomPage() {
  const router = useRouter();
  
  // --- STATE MANAGEMENT ---
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "System", 
      content: "Court is in session. The Judge is waiting for your opening statement." 
    }
  ]);
  
  // Auto-scroll to bottom of chat
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- 1. TRIAL GATEKEEPER LOGIC ---
  // In a real app, get this from your Auth Context
  const USER_ID = "test-user-id"; 

  useEffect(() => {
    const checkTrialStatus = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/trial-status/${USER_ID}`);
        if (!res.ok) return; // Fail silently or handle error
        
        const data = await res.json();
        
        // If trial is used AND user is not premium, kick them out
        if (data.has_used_trial && !data.is_premium) {
          alert("Your free trial has ended. Please upgrade to continue.");
          router.push("/"); 
        }
      } catch (error) {
        console.error("Failed to check trial status:", error);
      }
    };
    
    checkTrialStatus();
  }, [router]);

  // --- 2. SEND MESSAGE LOGIC ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput(""); // Clear input immediately
    setLoading(true);

    // Add User Message to UI
    setMessages((prev) => [...prev, { role: "You", content: userText }]);

    try {
      // Call the Backend Simulation Endpoint
      const res = await fetch("http://localhost:8000/api/simulation/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_argument: userText,
          case_context: "Theft under Section 378 IPC", // You can make this dynamic later
        }),
      });

      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();

      // The backend returns a combined string or distinct parts. 
      // Assuming it returns a raw string from the agents:
      setMessages((prev) => [
        ...prev, 
        { role: "AI Judge", content: data.response } 
      ]);
      
      // OPTIONAL: Mark trial as used after the first interaction
      // await fetch("http://localhost:8000/api/use-trial", { 
      //   method: "POST", 
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ user_id: USER_ID }) 
      // });

    } catch (error) {
      console.error("Error talking to AI:", error);
      setMessages((prev) => [
        ...prev, 
        { role: "System", content: "Error: Could not reach the court agents." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <div>
          <h1 className="text-sm font-semibold text-slate-100">
            LexArena Courtroom
          </h1>
          <p className="text-xs text-slate-400">
            Simulated hearing • Your role: Lead Counsel
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-300">
            1 free trial remaining
          </span>
          <button 
            onClick={() => router.push("/")}
            className="rounded-md border border-slate-700 px-2.5 py-1 text-slate-200 hover:bg-slate-800"
          >
            End Session
          </button>
        </div>
      </header>

      <section className="grid flex-1 gap-4 px-4 py-4 md:grid-cols-[2fr,1.2fr]">
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 text-xs text-slate-300">
            <span>Courtroom Transcript</span>
            <span className="text-slate-500">
              AI Judge • AI Opposing Counsel • You
            </span>
          </div>
          
          {/* --- DYNAMIC CHAT AREA --- */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-xs">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`rounded-lg px-3 py-2 ${
                  msg.role === "You" 
                    ? "bg-slate-800/80 text-slate-50" 
                    : msg.role === "System"
                    ? "bg-slate-950 text-slate-400 italic"
                    : "bg-slate-900/80 text-slate-100"
                }`}
              >
                <span className={`font-semibold ${
                  msg.role === "You" ? "text-sky-300" 
                  : msg.role === "AI Judge" ? "text-amber-300"
                  : "text-rose-300"
                }`}>
                  {msg.role}:
                </span>{" "}
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="animate-pulse text-slate-500 px-3">
                AI is deliberating...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-slate-800 p-3 text-xs">
            <label className="mb-1 block text-slate-300">
              Your next statement
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              className="mb-2 h-20 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-sky-500/50 focus:border-sky-500 focus:ring-1"
              placeholder="Address the judge's concern or respond to opposing counsel..."
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="inline-flex rounded-full bg-slate-800 px-2 py-1">
                  Role: Lead Counsel
                </span>
                <span>Mode: Hearing</span>
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center rounded-md bg-sky-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
              >
                {loading ? "Processing..." : "Send to AI Agents"}
              </button>
            </div>
          </form>
        </div>

        <aside className="flex flex-col gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Session Overview
            </p>
            <ul className="space-y-1 text-slate-300">
              <li>• Free trial: 1 session per user</li>
              <li>• Supabase tracks whether this trial is used</li>
              <li>• Once used, redirect to upgrade / subscribe flow</li>
            </ul>
          </div>
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Notes & strategy
            </p>
            <textarea
              className="h-full min-h-[120px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none ring-sky-500/40 focus:border-sky-500 focus:ring-1"
              placeholder="Capture key objections, themes, and follow-ups here..."
            />
          </div>
        </aside>
      </section>
    </main>
  );
}