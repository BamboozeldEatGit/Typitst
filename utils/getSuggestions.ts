const DATAMUSE_API = 'https://api.datamuse.com/words';
const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const cache = new Map<string, any>();

export async function getSmartSuggestions(word: string, _context: string = '') {
  if (word.length < 2) return [];

  const cacheKey = word.toLowerCase();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    // Get word suggestions
    const suggestResponse = await fetch(`${DATAMUSE_API}?sp=${encodeURIComponent(word)}*&max=10`);
    if (!suggestResponse.ok) throw new Error('Word suggestion API failed');
    const suggestions = await suggestResponse.json();

    // Get definitions for each word
    const wordsWithDefinitions = await Promise.all(
      suggestions.map(async (item: any) => {
        try {
          const defResponse = await fetch(`${DICTIONARY_API}/${item.word}`);
          if (!defResponse.ok) return { word: item.word, definition: '' };
          
          const data = await defResponse.json();
          const definition = data[0]?.meanings[0]?.definitions[0]?.definition || '';
          return {
            word: item.word,
            definition: definition
          };
        } catch (e) {
          return { word: item.word, definition: '' };
        }
      })
    );

    cache.set(cacheKey, wordsWithDefinitions);
    return wordsWithDefinitions;

  } catch (error) {
    console.error('API Error:', error);
    return [];
  }
}
