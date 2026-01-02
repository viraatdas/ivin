"use client";

import { useState, useEffect, use } from "react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PaperEditor from "@/components/PaperEditor";
import { Mood } from "@/components/MoodSelector";
import { JournalEntry, ChatMessage } from "@/lib/supabase";

export default function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useUser();
  const router = useRouter();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) {
      router.push("/handler/sign-in");
    }
  }, [user, router]);

  // Fetch entry
  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const response = await fetch("/api/entries");
        if (response.ok) {
          const data = await response.json();
          const foundEntry = data.entries?.find((e: JournalEntry) => e.id === id);
          if (foundEntry) {
            setEntry(foundEntry);
          } else {
            setError("Entry not found");
          }
        }
      } catch (err) {
        console.error("Failed to fetch entry:", err);
        setError("Failed to load entry");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && id) {
      fetchEntry();
    }
  }, [user, id]);

  const handleSave = async (data: { title: string; content: string; mood: Mood | null }) => {
    if (!data.content.trim()) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      const response = await fetch("/api/entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update entry");
      }

      const result = await response.json();
      setEntry(result.entry);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to save entry:", err);
      setSaveStatus("idle");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this entry? This cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/entries?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/history");
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  };

  const handleTitleEdit = () => {
    setEditedTitle(entry?.title || "");
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (!entry || !editedTitle.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: entry.id,
          title: editedTitle.trim(),
          content: entry.content,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setEntry(result.entry);
        setIsEditingTitle(false);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (err) {
      console.error("Failed to save title:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  if (user === null) {
    return null;
  }

  if (user === undefined || isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 px-6 flex items-center justify-center">
          <div className="text-gray-400 font-light">loading entry...</div>
        </main>
      </>
    );
  }

  if (error || !entry) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 px-6 flex flex-col items-center justify-center">
          <p className="text-gray-500 font-light mb-6">{error || "Entry not found"}</p>
          <button
            onClick={() => router.push("/history")}
            className="text-sm font-light text-gray-600 hover:text-black transition-colors"
          >
            ← back to entries
          </button>
        </main>
      </>
    );
  }

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const entryDate = new Date(entry.created_at).toLocaleDateString("en-US", {
    timeZone: userTimezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Render chat entry view
  if (entry.entry_type === "chat" && entry.chat_history) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-12 px-6">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.push("/history")}
                className="text-sm font-light text-gray-500 hover:text-black transition-colors"
              >
                ← back to entries
              </button>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push(`/chat?resume=${id}`)}
                  className="px-4 py-2 bg-black text-white text-sm font-light rounded-full hover:bg-gray-800 transition-colors"
                >
                  💬 resume chat
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs font-light text-gray-400 hover:text-red-500 transition-colors"
                >
                  delete
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={handleTitleKeyDown}
                      className="text-2xl font-light tracking-tight bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 flex-1 focus:outline-none focus:border-gray-400"
                      autoFocus
                    />
                    <button
                      onClick={handleTitleSave}
                      disabled={isSaving}
                      className="px-3 py-1 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                      {isSaving ? "..." : "save"}
                    </button>
                    <button
                      onClick={() => setIsEditingTitle(false)}
                      className="px-3 py-1 text-sm font-light text-gray-500 hover:text-black"
                    >
                      cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-light tracking-tight">
                      {entry.title || "Chat Conversation"}
                    </h1>
                    <button
                      onClick={handleTitleEdit}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit title"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <span className="px-2 py-0.5 rounded-full text-xs font-light text-white bg-gray-800">
                      💬 chat
                    </span>
                    {saveStatus === "saved" && (
                      <span className="text-xs font-light text-green-600">✓ saved</span>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs font-light text-gray-400">
                {entryDate}
              </p>
              {entry.summary && (
                <p className="text-sm font-light text-gray-600 mt-2 italic">
                  {entry.summary}
                </p>
              )}
            </div>

            {/* Chat messages */}
            <div className="space-y-4">
              {(entry.chat_history as ChatMessage[]).map((message, index) => (
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
              ))}
            </div>

            {/* Resume button at bottom */}
            <div className="mt-8 text-center">
              <button
                onClick={() => router.push(`/chat?resume=${id}`)}
                className="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-light rounded-full hover:bg-gray-200 transition-colors"
              >
                Continue this conversation →
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push("/history")}
              className="text-sm font-light text-gray-500 hover:text-black transition-colors"
            >
              ← back to entries
            </button>
            
            <div className="flex items-center gap-4">
              {saveStatus === "saved" && (
                <span className="text-xs font-light text-green-600">
                  ✓ saved
                </span>
              )}
              <button
                onClick={handleDelete}
                className="text-xs font-light text-gray-400 hover:text-red-500 transition-colors"
              >
                delete entry
              </button>
            </div>
          </div>

          <div className="text-xs font-light text-gray-400 mb-4">
            Originally written on {entryDate}
          </div>

          <PaperEditor
            initialTitle={entry.title || ""}
            initialContent={entry.content}
            initialMood={entry.mood as Mood | null}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      </main>
    </>
  );
}

