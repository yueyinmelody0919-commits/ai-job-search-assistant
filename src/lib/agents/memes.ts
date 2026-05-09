/**
 * Meme Engine — curated Office memes + GIPHY integration.
 * Agents send contextually relevant memes in Slack.
 */

// Curated memes keyed by character + situation
const CURATED_MEMES: Record<string, Record<string, string[]>> = {
  dwight: {
    success: [
      "https://media.giphy.com/media/JQFKHfuDR1oeY/giphy.gif", // Dwight fist pump
      "https://media.giphy.com/media/UjCXeFnYcI2R2/giphy.gif", // Dwight victory
    ],
    report: [
      "https://media.giphy.com/media/dXFKDUolyLLi8gq6Cl/giphy.gif", // FACT
      "https://media.giphy.com/media/H7rPe2vxtmKgBkMiqA/giphy.gif", // Dwight serious
    ],
    sass: [
      "https://media.giphy.com/media/3kzJvEciJa94SMW3hN/giphy.gif", // False
    ],
  },
  oscar: {
    correcting: [
      "https://media.giphy.com/media/Yycc82XEy73VY2ESRI/giphy.gif", // Actually...
    ],
    analysis: [
      "https://media.giphy.com/media/DHqth0hVQoIzS/giphy.gif", // Oscar thinking
    ],
  },
  jim: {
    prank: [
      "https://media.giphy.com/media/JFawGLFMCJNDi/giphy.gif", // Jim smirk
      "https://media.giphy.com/media/9058ZMj6ooluP4UUPl/giphy.gif", // Jim camera look
    ],
    casual: [
      "https://media.giphy.com/media/NfGTU1FFnPIwo/giphy.gif", // Jim shrug
    ],
  },
  angela: {
    disapproval: [
      "https://media.giphy.com/media/dEdmW17JnZhiU/giphy.gif", // Angela judging
    ],
    organized: [
      "https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif", // Angela satisfied
    ],
  },
  darryl: {
    wisdom: [
      "https://media.giphy.com/media/ui1hpFSqEnC5dqDEJl/giphy.gif", // Darryl nod
    ],
    cool: [
      "https://media.giphy.com/media/iH2IldVkqeLuJ7eJ0L/giphy.gif", // Bippity boppity
    ],
  },
  holly: {
    excited: [
      "https://media.giphy.com/media/MZocLC5dJprPTcrm65/giphy.gif", // Holly excited
    ],
    supportive: [
      "https://media.giphy.com/media/3oKIPf3C7HqqYBVcCk/giphy.gif", // That's what she said
    ],
  },
  stanley: {
    done: [
      "https://media.giphy.com/media/bC9czlgCMtw4cj8RgH/giphy.gif", // Stanley pretzel day
      "https://media.giphy.com/media/lKXEBR8m1jWso/giphy.gif", // Did I stutter
    ],
    annoyed: [
      "https://media.giphy.com/media/daBMJkOb7PEYRJFiYm/giphy.gif", // Stanley eye roll
    ],
  },
};

/**
 * Get a curated meme for a character + situation.
 */
export function getCuratedMeme(
  character: string,
  situation: string
): string | null {
  const charMemes = CURATED_MEMES[character.toLowerCase()];
  if (!charMemes) return null;

  const situationMemes = charMemes[situation];
  if (!situationMemes || situationMemes.length === 0) return null;

  return situationMemes[Math.floor(Math.random() * situationMemes.length)];
}

/**
 * Search GIPHY for a relevant meme.
 */
export async function searchGiphy(
  query: string,
  limit: number = 5
): Promise<string[]> {
  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=${limit}&rating=pg`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.data || []).map(
      (gif: { images: { fixed_height: { url: string } } }) =>
        gif.images.fixed_height.url
    );
  } catch {
    return [];
  }
}

/**
 * Get a contextually relevant meme for a character, falling back to GIPHY.
 */
export async function getMeme(
  character: string,
  situation: string,
  fallbackQuery?: string
): Promise<string | null> {
  // Try curated first
  const curated = getCuratedMeme(character, situation);
  if (curated) return curated;

  // Fall back to GIPHY
  if (fallbackQuery) {
    const gifs = await searchGiphy(`the office ${fallbackQuery}`);
    if (gifs.length > 0) return gifs[0];
  }

  return null;
}

/**
 * Determine if an agent should send a meme based on context.
 * ~20% chance for casual situations, higher for celebrations/sass.
 */
export function shouldSendMeme(situation: string): boolean {
  const rates: Record<string, number> = {
    success: 0.5,
    sass: 0.4,
    prank: 0.6,
    report: 0.15,
    casual: 0.1,
    correcting: 0.2,
    disapproval: 0.3,
    done: 0.25,
  };
  return Math.random() < (rates[situation] || 0.1);
}
