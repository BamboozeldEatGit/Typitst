const SERP_API_KEY = 'YOUR_SERP_API_KEY'; // Replace with your actual API key

export interface CorrectionSuggestion {
  original: string;
  corrected: string;
  position: number;
}

export async function checkGrammar(text: string): Promise<CorrectionSuggestion | null> {
  try {
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(text + ' grammar check')}`
    );

    if (!response.ok) return null;
    const data = await response.json();

    // Look for grammar suggestions in the search results
    const correction = data.search_results?.[0]?.snippet;
    if (!correction) return null;

    // Extract the corrected text from the search result
    const matches = correction.match(/did you mean "(.*?)"/) || 
                   correction.match(/correction: "(.*?)"/) ||
                   correction.match(/suggested: "(.*?)"/i);

    if (!matches?.[1]) return null;

    return {
      original: text,
      corrected: matches[1],
      position: 0 // Position where the correction starts
    };
  } catch (error) {
    console.error('Grammar check failed:', error);
    return null;
  }
}
