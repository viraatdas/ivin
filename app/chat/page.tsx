"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@stackframe/stack";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/Navbar";
import { ChatMessage } from "@/lib/supabase";

export default function ChatPage() {
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [entryId, setEntryId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(false);

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) {
      router.push("/handler/sign-in");
    }
  }, [user, router]);

  // Load existing chat if resuming from an entry
  useEffect(() => {
    const resumeEntryId = searchParams.get("resume");
    if (resumeEntryId && user && !initialLoadRef.current) {
      initialLoadRef.current = true;
      setEntryId(resumeEntryId);
      
      // Fetch the entry to get chat history
      fetch("/api/entries")
        .then((res) => res.json())
        .then((data) => {
          const entry = data.entries?.find((e: { id: string }) => e.id === resumeEntryId);
          if (entry?.chat_history) {
            setMessages(entry.chat_history);
          }
        })
        .catch((err) => console.error("Failed to load chat history:", err));
    }
  }, [searchParams, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const saveConversation = async () => {
    if (messages.length === 0 || isSaving) return;

    setIsSaving(true);
    try {
      // Create a content summary from the conversation
      const contentSummary = messages
        .map((m) => `${m.role === "user" ? "You" : "Journal AI"}: ${m.content}`)
        .join("\n\n");

      if (entryId) {
        // Update existing entry
        const response = await fetch("/api/entries", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: entryId,
            content: contentSummary,
            chat_history: messages,
          }),
        });

        if (response.ok) {
          router.push(`/entry/${entryId}`);
        }
      } else {
        // Create new entry
        const response = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Chat Conversation",
            content: contentSummary,
            entry_type: "chat",
            chat_history: messages,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setEntryId(data.entry.id);
          router.push(`/entry/${data.entry.id}`);
        }
      }
    } catch (error) {
      console.error("Failed to save conversation:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setStreamingContent("");

    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          chatHistory: messages,
          userTimezone,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Check if it's a streaming response
      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("text/plain")) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = decoder.decode(value, { stream: true });
            fullContent += text;
            setStreamingContent(fullContent);
          }
        }

        // Add the complete message to history
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullContent },
        ]);
        setStreamingContent("");
      } else {
        // Handle non-streaming response (e.g., no entries case)
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
      setStreamingContent("");
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
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-tight mb-1">
                {entryId ? "resume conversation" : "chat with your journal"}
              </h1>
              <p className="text-sm font-light text-gray-500">
                Ask questions about your entries, explore patterns, or reflect on your journey.
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={saveConversation}
                disabled={isSaving}
                className="group px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white text-sm font-light rounded-lg hover:from-gray-800 hover:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    saving...
                  </>
                ) : entryId ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    update entry
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    save as entry
                  </>
                )}
              </button>
            )}
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 && !streamingContent ? (
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
              <>
                {messages.map((message, index) => (
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
                      {message.role === "user" ? (
                        <p className="text-sm font-light leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      ) : (
                        <div className="text-sm font-light leading-relaxed prose prose-sm prose-gray max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:font-medium prose-headings:mt-3 prose-headings:mb-1 prose-strong:font-medium prose-code:bg-gray-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Streaming message */}
                {streamingContent && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-gray-100 text-gray-800">
                      <div className="text-sm font-light leading-relaxed prose prose-sm prose-gray max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:font-medium prose-headings:mt-3 prose-headings:mb-1 prose-strong:font-medium prose-code:bg-gray-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none">
                        <ReactMarkdown>{streamingContent}</ReactMarkdown>
                        <span className="inline-block w-1 h-4 bg-gray-400 ml-0.5 animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Loading indicator (only show if loading but not streaming yet) */}
                {isLoading && !streamingContent && (
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
              </>
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
