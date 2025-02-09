const SERP_API = 'https://serpapi.com/search.json';
const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';

export interface SpellCheckResult {
  original: string;
  suggestions: Array<{
    word: string;
    definition: string;
    partOfSpeech: string;
  }>;
  isCorrect: boolean;
  errors: Array<{
    word: string;
    suggestions: Array<{
      word: string;
      definition: string;
      partOfSpeech: string;
    }>;
    position: number;
  }>;
}

export async function checkSpelling(text: string): Promise<SpellCheckResult> {
  const words = text.toLowerCase().split(/\s+/);
  const errors: SpellCheckResult['errors'] = [];

  // Check each word
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    try {
      const response = await fetch(`${DICTIONARY_API}/${encodeURIComponent(word)}`);
      
      if (!response.ok) {
        // Word not found in dictionary - get suggestions
        const suggestions = await findSimilarWords(word);
        errors.push({
          word,
          position: i,
          suggestions: suggestions
        });
      }
    } catch (error) {
      console.error('Dictionary API error:', error);
    }
  }

  return {
    original: text,
    suggestions: errors.flatMap(e => e.suggestions),
    isCorrect: errors.length === 0,
    errors
  };
}

async function findSimilarWords(word: string) {
  try {
    // Get similar sounding words
    const response = await fetch(`${DICTIONARY_API}/similar/${encodeURIComponent(word)}`);
    if (!response.ok) return [];

    const data = await response.json();
    const suggestions = await Promise.all(
      data.slice(0, 5).map(async (suggestion: string) => {
        try {
          const defResponse = await fetch(`${DICTIONARY_API}/${suggestion}`);
          const defData = await defResponse.json();
          return {
            word: suggestion,
            definition: defData[0]?.meanings[0]?.definitions[0]?.definition || '',
            partOfSpeech: defData[0]?.meanings[0]?.partOfSpeech || ''
          };
        } catch {
          return {
            word: suggestion,
            definition: '',
            partOfSpeech: ''
          };
        }
      })
    );

    return suggestions;
  } catch (error) {
    console.error('Error finding similar words:', error);
    return [];
  }
}
