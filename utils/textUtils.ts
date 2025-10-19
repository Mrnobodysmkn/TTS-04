/**
 * Splits a long text into smaller chunks of a maximum size, trying to split at sentence endings.
 * @param text The full text to be split.
 * @param maxLength The maximum length of each chunk.
 * @returns An array of text chunks.
 */
export function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remainingText = text.trim();

  // Regex to find sentence endings. Includes Persian and English punctuation.
  const sentenceEndings = /[.!?۔؟]\s|[\n\r]/g;

  while (remainingText.length > 0) {
    if (remainingText.length <= maxLength) {
      chunks.push(remainingText);
      break;
    }

    let chunk = remainingText.substring(0, maxLength);
    let lastSentenceEnd = -1;

    // Find the last sentence ending within the chunk
    const matches = Array.from(chunk.matchAll(sentenceEndings));
    if (matches.length > 0) {
        lastSentenceEnd = matches[matches.length - 1].index! + matches[matches.length-1][0].length;
    }

    if (lastSentenceEnd > 0) {
      // Split at the found sentence ending
      chunk = remainingText.substring(0, lastSentenceEnd);
    } else {
      // If no sentence ending is found, do a hard split, trying to find a space first
      const lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > maxLength / 2) { // Only split at space if it's not too early
        chunk = remainingText.substring(0, lastSpace);
      }
      // Otherwise, the chunk remains the full maxLength substring
    }
    
    chunks.push(chunk.trim());
    remainingText = remainingText.substring(chunk.length).trim();
  }

  return chunks;
}
