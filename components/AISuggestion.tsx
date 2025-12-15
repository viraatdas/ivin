"use client";

interface AISuggestionProps {
  suggestion: string;
  isLoading: boolean;
  onDismiss: () => void;
}

export default function AISuggestion({ suggestion, isLoading, onDismiss }: AISuggestionProps) {
  if (!suggestion && !isLoading) return null;

  return (
    <div className="ai-suggestion mt-4 mb-6 pl-6 border-l-2 border-gray-200">
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75" />
          <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150" />
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <p className="text-sm font-light text-gray-500 italic leading-relaxed flex-1">
            {suggestion}
          </p>
          <button
            onClick={onDismiss}
            className="text-gray-300 hover:text-gray-500 transition-colors text-xs"
            aria-label="Dismiss suggestion"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

