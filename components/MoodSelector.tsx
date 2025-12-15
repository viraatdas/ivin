"use client";

import { useState } from "react";

export type Mood = "calm" | "happy" | "anxious" | "sad" | "grateful" | "reflective";

const moods: { value: Mood; label: string; color: string }[] = [
  { value: "calm", label: "calm", color: "bg-[#A7C7E7]" },
  { value: "happy", label: "happy", color: "bg-[#FFE5A0]" },
  { value: "anxious", label: "anxious", color: "bg-[#FFB4A2]" },
  { value: "sad", label: "sad", color: "bg-[#B8C5D6]" },
  { value: "grateful", label: "grateful", color: "bg-[#C1E1C1]" },
  { value: "reflective", label: "reflective", color: "bg-[#DDD5F3]" },
];

interface MoodSelectorProps {
  selectedMood: Mood | null;
  onMoodChange: (mood: Mood | null) => void;
}

export default function MoodSelector({ selectedMood, onMoodChange }: MoodSelectorProps) {
  const [hoveredMood, setHoveredMood] = useState<Mood | null>(null);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-light text-gray-400 uppercase tracking-wider">
        mood
      </span>
      
      <div className="flex items-center gap-1.5">
        {moods.map((mood) => {
          const isSelected = selectedMood === mood.value;
          const isHovered = hoveredMood === mood.value;
          const isExpanded = isSelected || isHovered;
          
          return (
            <button
              key={mood.value}
              onClick={() => {
                if (selectedMood === mood.value) {
                  onMoodChange(null);
                } else {
                  onMoodChange(mood.value);
                }
              }}
              onMouseEnter={() => setHoveredMood(mood.value)}
              onMouseLeave={() => setHoveredMood(null)}
              style={{
                width: isExpanded ? 'auto' : '20px',
                paddingLeft: isExpanded ? '10px' : '0',
                paddingRight: isExpanded ? '10px' : '0',
              }}
              className={`
                h-5 rounded-full flex items-center justify-center
                transition-all duration-200 ease-out overflow-hidden
                ${isSelected 
                  ? `${mood.color} shadow-sm` 
                  : `${mood.color} opacity-40 hover:opacity-100`
                }
              `}
              title={mood.label}
            >
              {isExpanded && (
                <span className="text-[10px] font-light text-gray-700 whitespace-nowrap">
                  {mood.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
