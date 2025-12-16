"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const user = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) {
      router.push("/handler/sign-in");
    }
  }, [user, router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (user === null) {
    return null;
  }

  if (user === undefined) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 px-6 flex items-center justify-center">
          <div className="text-gray-400 font-light">loading...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-6 px-6">
        <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-light tracking-tight mb-1">
              chat with your journal
            </h1>
            <p className="text-sm font-light text-gray-500">
              Ask questions about your entries, explore patterns, or reflect on your journey.
            </p>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-400 font-light mb-4">
                    Start a conversation about your journal entries
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p className="cursor-pointer hover:text-black transition-colors" onClick={() => setInput("What themes appear most often in my journal?")}>
                      → What themes appear most often in my journal?
                    </p>
                    <p className="cursor-pointer hover:text-black transition-colors" onClick={() => setInput("How has my mood changed over time?")}>
                      → How has my mood changed over time?
                    </p>
                    <p className="cursor-pointer hover:text-black transition-colors" onClick={() => setInput("What should I reflect on today?")}>
                      → What should I reflect on today?
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm font-light leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your journal..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm font-light focus:outline-none focus:border-gray-400 transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-black text-white text-sm font-light rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              send
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

