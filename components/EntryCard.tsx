"use client";

import Link from "next/link";
import { JournalEntry } from "@/lib/supabase";

const moodColors: Record<string, string> = {
  calm: "bg-[#A7C7E7]",
  happy: "bg-[#FFE5A0]",
  anxious: "bg-[#FFB4A2]",
  sad: "bg-[#B8C5D6]",
  grateful: "bg-[#C1E1C1]",
  reflective: "bg-[#DDD5F3]",
};

interface EntryCardProps {
  entry: JournalEntry;
  onDelete?: (id: string) => void;
}

export default function EntryCard({ entry, onDelete }: EntryCardProps) {
  const date = new Date(entry.created_at);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  // Get preview of content (first 150 chars)
  const preview = entry.content.slice(0, 150).trim();
  const hasMore = entry.content.length > 150;

  return (
    <Link
      href={`/entry/${entry.id}`}
      className="block group"
    >
      <article className="p-6 bg-white border border-gray-100 hover:border-gray-200 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <time className="text-xs font-light text-gray-400">
              {formattedDate} · {formattedTime}
            </time>
            {entry.mood && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-light text-gray-700 ${moodColors[entry.mood] || "bg-gray-200"}`}
              >
                {entry.mood}
              </span>
            )}
          </div>
          
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(entry.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-500 transition-all"
            >
              delete
            </button>
          )}
        </div>

        {entry.title && (
          <h3 className="text-lg font-serif font-light mb-2 group-hover:text-gray-700 transition-colors">
            {entry.title}
          </h3>
        )}

        <p className="text-sm font-light text-gray-600 leading-relaxed">
          {preview}
          {hasMore && <span className="text-gray-400">...</span>}
        </p>

        <div className="mt-4 text-xs font-light text-gray-400">
          {entry.content.split(/\s+/).filter(Boolean).length} words
        </div>
      </article>
    </Link>
  );
}

