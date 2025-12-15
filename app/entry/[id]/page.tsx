"use client";

import { useState, useEffect, use } from "react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PaperEditor from "@/components/PaperEditor";
import { Mood } from "@/components/MoodSelector";
import { JournalEntry } from "@/lib/supabase";

export default function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useUser();
  const router = useRouter();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

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

  const entryDate = new Date(entry.created_at).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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

