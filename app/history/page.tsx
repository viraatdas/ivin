"use client";

import { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import EntryCard from "@/components/EntryCard";
import { JournalEntry } from "@/lib/supabase";

const PAGE_SIZE = 50;

export default function HistoryPage() {
  const user = useUser();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);

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
        const response = await fetch(`/api/entries?limit=${PAGE_SIZE}&offset=0`);
        if (response.ok) {
          const data = await response.json();
          setEntries(data.entries || []);
          setTotalCount(data.totalCount ?? null);
          setHasMore((data.entries?.length || 0) >= PAGE_SIZE);
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

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      const response = await fetch(`/api/entries?limit=${PAGE_SIZE}&offset=${entries.length}`);
      if (response.ok) {
        const data = await response.json();
        const newEntries = data.entries || [];
        setEntries(prev => [...prev, ...newEntries]);
        setHasMore(newEntries.length >= PAGE_SIZE);
      }
    } catch (error) {
      console.error("Failed to load more entries:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

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

  // Group entries by month using user's local timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const groupedEntries = entries.reduce((groups, entry) => {
    const date = new Date(entry.created_at);
    const monthYear = date.toLocaleDateString("en-US", {
      timeZone: userTimezone,
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
          <header className="mb-12 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-tight mb-2">
                your entries
              </h1>
              <p className="text-sm font-light text-gray-500">
                {totalCount ?? entries.length} {(totalCount ?? entries.length) === 1 ? "entry" : "entries"} total
              </p>
            </div>
            <button
              onClick={() => router.push("/journal")}
              className="group px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white text-sm font-light rounded-lg hover:from-gray-800 hover:to-gray-600 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              new entry
            </button>
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
              
              {/* Load More Section */}
              {hasMore && (
                <div className="text-center pt-8">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-2 border border-gray-300 text-gray-600 text-sm font-light tracking-wide hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? "loading..." : "load more entries"}
                  </button>
                  {totalCount && (
                    <p className="text-xs text-gray-400 mt-3">
                      showing {entries.length} of {totalCount} entries
                    </p>
                  )}
                </div>
              )}
              
              {!hasMore && entries.length > PAGE_SIZE && (
                <p className="text-center text-xs text-gray-400 pt-4">
                  you&apos;ve reached the beginning ✨
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

