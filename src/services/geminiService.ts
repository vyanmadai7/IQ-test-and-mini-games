import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
export type Modality = 'VISUAL_MATRIX' | 'NUMERICAL' | 'LOGICAL' | 'AUDIO_TONES' | 'MEMORY' | 'SPEED';

export interface TestQuestion {
  id: string;
  modality: Modality;
  difficulty: Difficulty;
  instruction: string;
  questionData: any; // specific to modality
  options: { id: string; content: any; isCorrect: boolean }[];
  timeLimit: number;
}

const VISUAL_SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hexagon'];
const VISUAL_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
const VISUAL_FILLS = ['solid', 'outline', 'dotted'];

export async function generateCognitiveArt(strength: string, iq: number): Promise<string | null> {
  const prompt = `Abstract, beautiful, futuristic glowing neural network. Dark sleek background, neon blue and emerald glowing nodes, visualizing a powerful mind with a high IQ of ${iq} and top cognitive strength in ${strength}. Subtle glassmorphism aesthetic, highly detailed UI background asset.`;
  
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9',
        outputMimeType: 'image/jpeg',
      }
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64 = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64}`;
    }
  } catch (error) {
    console.error("Failed to generate image:", error);
  }
  return null;
}
export async function generateInsight(iq: number, radar: any[]): Promise<string> {
  const prompt = `You are an expert psychometrician. Based on the following cognitive profile of a user who took a multimodal IQ test, provide a brief (2-3 sentences max) professional and insightful analysis of their cognitive strengths and weaknesses.
  Estimated IQ: ${iq}
  Profile (0-100 scale on each modality):
  ${JSON.stringify(radar, null, 2)}
  
  Do not mention the raw numbers heavily. Focus on the interpretation, like "User shows strong abstract spatial reasoning but slightly weaker auditory processing speed." Feel free to sound highly analytical and scientific.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Insight could not be generated.";
  } catch (error: any) {
    console.error("Failed to generate insight:", error);
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
      return "Due to high traffic, detailed AI analysis is temporarily unavailable. However, your cognitive profile reveals a balanced and capable intellect across multiple domains.";
    }
    return "Analysis incomplete due to a cognitive processing error in the system.";
  }
}

export async function generateQuestion(modality: Modality, difficulty: Difficulty): Promise<TestQuestion> {
  try {
     const res = await fetch(`/api/questions?modality=${modality}&difficulty=${difficulty}`);
     if (!res.ok) throw new Error("API Route Failed");
     return await res.json();
  } catch (error) {
     console.error("Falling back to local generated state", error);
     throw error;
  }
}
