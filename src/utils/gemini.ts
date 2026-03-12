import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with the key from environment variables
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface GeminiAnalysisResult {
  suggestedNames: string[];
  initialName: string;
}

/**
 * Helper function to convert a Data URL (base64) into the format expected by Gemini API
 */
function fileToGenerativePart(dataUrl: string, mimeType: string) {
  // Extract the base64 part of the data URL
  const base64Data = dataUrl.split(',')[1];
  return {
    inlineData: {
      data: base64Data,
      mimeType
    },
  };
}

/**
 * Annotates an image using Gemini 1.5 Flash model and returns suggested item names
 */
export async function analyzeItemImage(dataUrl: string): Promise<GeminiAnalysisResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log("[v0] VITE_GEMINI_API_KEY exists:", !!apiKey);
  console.log("[v0] API Key length:", apiKey?.length || 0);

  if (!apiKey) {
    console.warn('[v0] VITE_GEMINI_API_KEY is not defined. Falling back to mock data.');
    return {
      suggestedNames: ['モックアイテム1', 'モックアイテム2', 'モックアイテム3'],
      initialName: 'モックアイテム1'
    };
  }

  // Re-initialize with the API key to ensure it's fresh
  const genAIInstance = new GoogleGenerativeAI(apiKey);

  try {
    // Choose the model that handles both text and images
    const model = genAIInstance.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log("[v0] Model initialized successfully");

    // Assuming JPEG from our canvas capture
    const imagePart = fileToGenerativePart(dataUrl, 'image/jpeg');

    const prompt = `
      この画像に写っている主要な「収納管理すべきアイテム」の名前を3つ提案してください。
      結果は以下のJSONフォーマットのみで返してください（マークダウンや他の文章は含めないでください）。
      
      {
        "suggestedNames": ["名前候補1", "名前候補2", "名前候補3"],
        "initialName": "最も適切な名前候補"
      }
    `;

    console.log("[v0] Sending request to Gemini API...");
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    console.log("[v0] Gemini API response:", responseText);

    // Clean up potential markdown formatting from the response
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    console.log("[v0] Parsed JSON string:", jsonString);

    const parsedData = JSON.parse(jsonString) as GeminiAnalysisResult;
    console.log("[v0] Parsed data:", parsedData);
    return parsedData;
  } catch (error: any) {
    console.error('[v0] Error analyzing image with Gemini:', error);
    console.error('[v0] Error message:', error?.message);
    console.error('[v0] Error status:', error?.status);
    // Return graceful fallback 
    return {
      suggestedNames: ['アイテム名（解析失敗）', '不明なアイテム'],
      initialName: 'アイテム名（解析失敗）'
    };
  }
}
