"use client";

import { useState } from "react";
import Image from "next/image";

type AnalysisResult = {
  rating: number;
  percentile: number;
  summary: string;
  coaching_tip: string;
};

type PlayerSnapshot = {
  gameName: string;
  tagLine: string;
  region: string;
  summonerLevel: number;
  tier: string;
  rank: string;
  recent_matches: any[];
};

type SessionData = {
  session_id: string;
  snapshot: PlayerSnapshot;
  analysis: AnalysisResult;
};

type Message = {
  role: "user" | "coach";
  content: string;
};

export default function Home() {
  const [step, setStep] = useState<"input" | "loading" | "dashboard">("input");
  const [formData, setFormData] = useState({
    gameName: "SuperNovaDoom123",
    tagLine: "12345",
    region: "na1",
  });
  const [session, setSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("loading");
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Analysis failed");
      }

      const data = await res.json();
      const sessionId = data.session_id;

      // Fetch full insights
      const insightsRes = await fetch(
        `http://localhost:8000/api/insights/${sessionId}`
      );
      const insights = await insightsRes.json();

      setSession(insights);
      setMessages([
        { role: "coach", content: insights.analysis.coaching_tip },
      ]);
      setStep("dashboard");
    } catch (err: any) {
      setError(err.message);
      setStep("input");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !session) return;

    const userMsg = inputMessage;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInputMessage("");
    setIsChatLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.session_id,
          message: userMsg,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "coach", content: data.response },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto p-6">
        <header className="mb-12 text-center pt-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            League AI Coach
          </h1>
          <p className="text-neutral-400">
            Powered by DeepSeek R1 & Claude 3.5 Haiku
          </p>
        </header>

        {step === "input" && (
          <form
            onSubmit={handleAnalyze}
            className="max-w-md mx-auto bg-neutral-900 p-8 rounded-2xl border border-neutral-800 shadow-2xl"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-400">
                  Riot ID (Game Name)
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.gameName}
                  onChange={(e) =>
                    setFormData({ ...formData, gameName: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-400">
                    Tag Line
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.tagLine}
                    onChange={(e) =>
                      setFormData({ ...formData, tagLine: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-neutral-400">
                    Region
                  </label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({ ...formData, region: e.target.value })
                    }
                  >
                    <option value="na1">NA</option>
                    <option value="euw1">EUW</option>
                    <option value="kr">KR</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-blue-900/20"
              >
                Analyze Profile
              </button>
            </div>
          </form>
        )}

        {step === "loading" && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <h2 className="text-xl font-semibold">Analyzing Match History...</h2>
            <p className="text-neutral-500 mt-2">
              Consulting DeepSeek R1 for statistical rating...
            </p>
          </div>
        )}

        {step === "dashboard" && session && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar Stats */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold bg-gradient-to-br from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {session.analysis.rating}
                  </div>
                  <div className="text-sm text-neutral-500 mt-1">
                    AI Rating (Top {100 - session.analysis.percentile}%)
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                      Player
                    </div>
                    <div className="font-medium">
                      {session.snapshot.gameName}
                      <span className="text-neutral-500">
                        #{session.snapshot.tagLine}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                      Rank
                    </div>
                    <div className="font-medium">
                      {session.snapshot.tier} {session.snapshot.rank}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
                <h3 className="font-semibold mb-3 text-neutral-300">Analysis Summary</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {session.analysis.summary}
                </p>
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 flex flex-col h-[600px] bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-neutral-800 text-neutral-200"
                        }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-neutral-800 rounded-2xl px-5 py-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-neutral-800 bg-neutral-900">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Ask your coach anything..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading || !inputMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-medium transition-all"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
