"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import MoodSelector, { Mood } from "./MoodSelector";
import AISuggestion from "./AISuggestion";

interface ParagraphSuggestion {
  paragraphIndex: number;
  suggestion: string;
  dismissed: boolean;
}

interface PaperEditorProps {
  initialTitle?: string;
  initialContent?: string;
  initialMood?: Mood | null;
  prompts?: string[];
  onSave: (data: { title: string; content: string; mood: Mood | null }) => Promise<void>;
  onPromptsViewed?: () => void;
  isSaving?: boolean;
}

export default function PaperEditor({
  initialTitle = "",
  initialContent = "",
  initialMood = null,
  prompts = [],
  onSave,
  onPromptsViewed,
  isSaving = false,
}: PaperEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [mood, setMood] = useState<Mood | null>(initialMood);
  const [showPrompts, setShowPrompts] = useState(prompts.length > 0);
  const [paragraphSuggestions, setParagraphSuggestions] = useState<ParagraphSuggestion[]>([]);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [lastParagraphCount, setLastParagraphCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(400, textareaRef.current.scrollHeight)}px`;
    }
  }, [content]);

  // Auto-save functionality
  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (content.trim()) {
        onSave({ title, content, mood });
      }
    }, 2000);
  }, [title, content, mood, onSave]);

  useEffect(() => {
    triggerAutoSave();
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, mood, triggerAutoSave]);

  // Detect new paragraphs and fetch suggestions
  useEffect(() => {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    const currentParagraphCount = paragraphs.length;

    if (currentParagraphCount > lastParagraphCount && currentParagraphCount > 0) {
      const lastParagraph = paragraphs[paragraphs.length - 1];
      
      // Only fetch suggestion if the paragraph is substantial (> 50 chars)
      if (lastParagraph.length > 50 && !loadingSuggestion) {
        fetchSuggestion(lastParagraph, paragraphs.slice(0, -1).join("\n\n"), currentParagraphCount - 1);
      }
    }
    
    setLastParagraphCount(currentParagraphCount);
  }, [content, lastParagraphCount, loadingSuggestion]);

  const fetchSuggestion = async (currentParagraph: string, previousContent: string, paragraphIndex: number) => {
    setLoadingSuggestion(true);
    
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentParagraph, previousContent }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setParagraphSuggestions(prev => [
          ...prev.filter(s => s.paragraphIndex !== paragraphIndex),
          { paragraphIndex, suggestion: data.suggestion, dismissed: false }
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch suggestion:", error);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const dismissSuggestion = (paragraphIndex: number) => {
    setParagraphSuggestions(prev =>
      prev.map(s =>
        s.paragraphIndex === paragraphIndex ? { ...s, dismissed: true } : s
      )
    );
  };

  const handleDismissPrompts = () => {
    setShowPrompts(false);
    onPromptsViewed?.();
  };

  const handlePromptClick = (prompt: string) => {
    setContent(prev => (prev ? `${prev}\n\n${prompt}` : prompt));
    textareaRef.current?.focus();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get current suggestion for display
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  const currentSuggestion = paragraphSuggestions.find(
    s => s.paragraphIndex === paragraphs.length - 1 && !s.dismissed
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Paper container */}
      <div className="bg-[#FAFAF8] rounded-sm shadow-lg border border-gray-100 min-h-[600px]">
        {/* Header */}
        <div className="px-12 pt-10 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <time className="text-xs font-light text-gray-400 uppercase tracking-wider">
              {currentDate}
            </time>
            <MoodSelector selectedMood={mood} onMoodChange={setMood} />
          </div>
          
          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full bg-transparent text-2xl font-serif font-light tracking-tight placeholder:text-gray-300 border-none focus:outline-none"
          />
        </div>

        {/* Prompts section */}
        {showPrompts && prompts.length > 0 && (
          <div className="px-12 py-6 bg-gray-50/50 border-b border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-light text-gray-400 uppercase tracking-wider">
                today&apos;s prompts
              </span>
              <button
                onClick={handleDismissPrompts}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                dismiss
              </button>
            </div>
            <div className="space-y-2">
              {prompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt)}
                  className="block w-full text-left text-sm font-light text-gray-600 hover:text-black transition-colors py-1"
                >
                  → {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Editor area */}
        <div className="px-12 py-8">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Begin writing..."
            className="journal-editor w-full bg-transparent resize-none border-none focus:outline-none min-h-[400px]"
          />
          
          {/* AI Suggestion */}
          {(currentSuggestion || loadingSuggestion) && (
            <AISuggestion
              suggestion={currentSuggestion?.suggestion || ""}
              isLoading={loadingSuggestion}
              onDismiss={() => currentSuggestion && dismissSuggestion(currentSuggestion.paragraphIndex)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-12 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs font-light text-gray-400">
            {content.split(/\s+/).filter(Boolean).length} words
          </div>
          <div className="flex items-center gap-4">
            {isSaving && (
              <span className="text-xs font-light text-gray-400">
                saving...
              </span>
            )}
            <button
              onClick={() => onSave({ title, content, mood })}
              disabled={isSaving || !content.trim()}
              className="px-4 py-2 text-xs font-light tracking-wide bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              save entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

