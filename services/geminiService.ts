import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

let ai: GoogleGenAI | null = null;
const TIMEOUT_MS = 60000; // 60 seconds

export function setApiKey(key: string) {
    ai = new GoogleGenAI({ apiKey: key });
}

function getAiInstance(): GoogleGenAI {
    if (!ai) {
        throw new Error("Gemini API key not set. Please set it in the application.");
    }
    return ai;
}


function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`API call timed out after ${ms}ms`));
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
}

export async function enhanceTextForTTS(text: string): Promise<string> {
    const aiInstance = getAiInstance();
    try {
        const promise = aiInstance.models.generateContent({
            model: "gemini-2.5-pro",
            contents: text,
            config: {
                systemInstruction: "You are an expert in Persian linguistics and a creative writer. Your knowledge is up-to-date as of October 18, 2025. A user has provided Persian text to be converted to speech. Your task is to subtly rewrite the text to sound more natural, expressive, and human-like when read by a state-of-the-art text-to-speech engine. This may involve adding appropriate pauses (using ellipses ...), adjusting sentence structure for better rhythm, and adding subtle emotional cues through wording. Do not alter the core meaning of the text. Only output the refined, speakable Persian text.",
            }
        });
        const response: GenerateContentResponse = await withTimeout(promise, TIMEOUT_MS);
        return response.text.trim();
    } catch (error) {
        console.error("Error enhancing text with Gemini Pro:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to enhance text: ${error.message}`);
        }
        throw new Error("An unknown error occurred while enhancing text.");
    }
}


export async function generateSpeech(text: string, voice: string): Promise<string> {
  const aiInstance = getAiInstance();
  try {
    const promise = aiInstance.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const response: GenerateContentResponse = await withTimeout(promise, TIMEOUT_MS);

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from the API. The response may be empty or blocked. Check your API key and permissions.");
    }
    
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate speech: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating speech.");
  }
}
