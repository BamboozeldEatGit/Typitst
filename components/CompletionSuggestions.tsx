"use client"
import { Card } from "@/components/ui/card"

interface Suggestion {
  word: string;
  definition: string;
}

interface CompletionSuggestionsProps {
  suggestions: Suggestion[];
  position: { x: number; y: number } | null;
  onSelect: (word: string) => void;
  selectedIndex: number;
  currentWord?: string;
}

const matchCase = (suggestion: string, currentWord: string = ''): string => {
  if (!currentWord) return suggestion;
  
  if (currentWord === currentWord.toUpperCase()) {
    return suggestion.toUpperCase();
  }
  if (currentWord[0] === currentWord[0].toUpperCase()) {
    return suggestion.charAt(0).toUpperCase() + suggestion.slice(1).toLowerCase();
  }
  return suggestion.toLowerCase();
};

export function CompletionSuggestions({ 
  suggestions, 
  position, 
  onSelect,
  selectedIndex,
  currentWord = ''
}: CompletionSuggestionsProps) {
  if (!position || suggestions.length === 0) return null;

  return (
    <Card
      className="absolute z-50 w-[300px] shadow-lg border border-border bg-popover"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 20}px`
      }}
    >
      <ul className="py-2">
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            className={`px-2 py-1.5 cursor-pointer flex items-baseline gap-2 ${
              index === selectedIndex ? 'bg-secondary text-secondary-foreground' : 'hover:bg-secondary/50'
            }`}
            onClick={() => onSelect(suggestion.word)}
          >
            <span className="font-medium whitespace-nowrap">
              {matchCase(suggestion.word, currentWord)}
            </span>
            {suggestion.definition && (
              <span className="text-xs text-muted-foreground truncate opacity-70">
                {suggestion.definition.replace(/^[^:]*:\s*/, '')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
