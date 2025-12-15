"use client";

import { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PaperEditor from "@/components/PaperEditor";
import { Mood } from "@/components/MoodSelector";

export default function JournalPage() {
  const user = useUser();
  const router = useRouter();
  const [prompts, setPrompts] = useState<string[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) {
      router.push("/handler/sign-in");
    }
  }, [user, router]);

  // Fetch prompts on mount
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch("/api/prompts");
        if (response.ok) {
          const data = await response.json();
          setPrompts(data.prompts || []);
        }
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
      } finally {
        setIsLoadingPrompts(false);
      }
    };

    if (user) {
      fetchPrompts();
    }
  }, [user]);

  const handleSave = async (data: { title: string; content: string; mood: Mood | null }) => {
    if (!data.content.trim()) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      if (currentEntryId) {
        // Update existing entry
        const response = await fetch("/api/entries", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: currentEntryId,
            ...data,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update entry");
        }
      } else {
        // Create new entry
        const response = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          setCurrentEntryId(result.entry.id);
        } else {
          throw new Error("Failed to create entry");
        }
      }

      setSaveStatus("saved");
      // Redirect to history after successful save
      router.push("/history");
    } catch (error) {
      console.error("Failed to save entry:", error);
      setSaveStatus("idle");
    } finally {
      setIsSaving(false);
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
      <main className="min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Status indicator */}
          <div className="flex justify-end mb-4">
            {saveStatus === "saved" && (
              <span className="text-xs font-light text-green-600">
                ✓ saved
              </span>
            )}
          </div>

          {isLoadingPrompts ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-gray-400 font-light">preparing your journal...</div>
            </div>
          ) : (
            <PaperEditor
              prompts={prompts}
              onSave={handleSave}
              isSaving={isSaving}
            />
          )}
        </div>
      </main>
    </>
  );
}

