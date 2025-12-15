"use client";

import { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import EntryCard from "@/components/EntryCard";
import { JournalEntry } from "@/lib/supabase";

export default function HistoryPage() {
  const user = useUser();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) {
      router.push("/handler/sign-in");
    }
  }, [user, router]);

  // Fetch entries
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch("/api/entries");
        if (response.ok) {
          const data = await response.json();
          setEntries(data.entries || []);
        }
      } catch (error) {
        console.error("Failed to fetch entries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchEntries();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/entries?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEntries(entries.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete entry:", error);
    } finally {
      setDeletingId(null);
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
          <div className="text-gray-400 font-light">loading your entries...</div>
        </main>
      </>
    );
  }

  // Group entries by month
  const groupedEntries = entries.reduce((groups, entry) => {
    const date = new Date(entry.created_at);
    const monthYear = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(entry);
    return groups;
  }, {} as Record<string, JournalEntry[]>);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          <header className="mb-12">
            <h1 className="text-3xl font-light tracking-tight mb-2">
              your entries
            </h1>
            <p className="text-sm font-light text-gray-500">
              {entries.length} {entries.length === 1 ? "entry" : "entries"} total
            </p>
          </header>

          {entries.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 font-light mb-6">
                You haven&apos;t written any journal entries yet.
              </p>
              <button
                onClick={() => router.push("/journal")}
                className="px-6 py-2 bg-black text-white text-sm font-light tracking-wide hover:bg-gray-800 transition-colors"
              >
                start writing
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedEntries).map(([monthYear, monthEntries]) => (
                <section key={monthYear}>
                  <h2 className="text-xs font-light text-gray-400 uppercase tracking-wider mb-4">
                    {monthYear}
                  </h2>
                  <div className="space-y-4">
                    {monthEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className={deletingId === entry.id ? "opacity-50" : ""}
                      >
                        <EntryCard
                          entry={entry}
                          onDelete={handleDelete}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

