// Centralized Nutrition Engine for AI-powered food analysis
// Primary: Gemini 1.5 Flash (fastest for vision)
// Fallback: NVIDIA Llama-3-Vision
// Local-First: Database lookup before API calls

export interface NutritionResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence_score?: number;
}

export interface StrictNutritionResponse {
  success: boolean;
  items: Array<{
    name: string;
    unit: string;
    multiplier: number;
    base_nutrients: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
  }>;
  confidence: number;
}

export interface HealthTip {
  tip: string;
}

/**
 * Analyze food image using Gemini 1.5 Flash with NVIDIA fallback
 */
export async function analyzeFoodImage(imageBase64: string): Promise<NutritionResult> {
  // Try Gemini first (fastest)
  try {
    return await analyzeWithGemini(imageBase64);
  } catch (geminiError) {
    console.error('Gemini failed, trying NVIDIA:', geminiError);
    // Fallback to NVIDIA
    return await analyzeWithNVIDIA(imageBase64);
  }
}

/**
 * Search food by name using local-first logic
 * 1. Check database (instant, no API cost)
 * 2. Fallback to Gemini API (costs money)
 */
export async function searchFoodByName(query: string, quantity?: number, unit?: string): Promise<NutritionResult[]> {
  try {
    // Use the API route which implements local-first logic
    const response = await fetch('/api/search-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, quantity, unit }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.results || [];
    }
    
    // Fallback to direct Gemini if API fails
    return await searchWithGeminiDirect(query);
  } catch (error) {
    console.error('Food search error:', error);
    return [];
  }
}

/**
 * Generate health tip using Gemini 1.5 Flash
 */
export async function generateHealthTip(food: NutritionResult): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a 1-sentence health tip for this food: ${food.name} (${food.calories} kcal, ${food.protein}g protein, ${food.carbs}g carbs, ${food.fats}g fats). Keep it under 50 characters and actionable.`,
            }],
          }],
          generationConfig: {
            maxOutputTokens: 50,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Health tip error:', error);
    const fallbackTips = [
      'Drink extra water!',
      'Great choice!',
      'Stay hydrated!',
      'Balance is key!',
    ];
    return fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
  }
}

// Internal: Direct Gemini fallback (only used if API route fails)
async function searchWithGeminiDirect(query: string): Promise<NutritionResult[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `SYSTEM INSTRUCTION: You are an expert Nutritionist API. You receive text data of meals. Do NOT provide conversational text. ONLY output valid JSON.

USER INPUT: ${query}

YOUR TASK: Analyze the input and return a JSON object with this structure:
{
  "success": true,
  "items": [
    {
      "name": "Food Name",
      "unit": "g",
      "multiplier": 1.0,
      "base_nutrients": {
        "calories": 100,
        "protein": 5,
        "carbs": 10,
        "fats": 2
      }
    }
  ],
  "confidence": 0.95
}`,
            }],
          }],
          generationConfig: {
            response_mime_type: 'application/json',
            maxOutputTokens: 300,
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API failed');
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    const parsed = JSON.parse(text) as StrictNutritionResponse;
    
    // Convert strict format to legacy format
    return parsed.items.map(item => ({
      name: item.name,
      calories: Math.round(item.base_nutrients.calories * item.multiplier),
      protein: Math.round(item.base_nutrients.protein * item.multiplier * 10) / 10,
      carbs: Math.round(item.base_nutrients.carbs * item.multiplier * 10) / 10,
      fats: Math.round(item.base_nutrients.fats * item.multiplier * 10) / 10,
      confidence_score: parsed.confidence,
    }));
  } catch (error) {
    console.error('Direct Gemini search error:', error);
    return [];
  }
}

// Internal: Gemini 1.5 Flash for image analysis
async function analyzeWithGemini(imageBase64: string): Promise<NutritionResult> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `SYSTEM INSTRUCTION: You are an expert Nutritionist API. You receive image data of meals. Do NOT provide conversational text. ONLY output valid JSON.

USER INPUT: Food Photo

YOUR TASK: Analyze the input and return a JSON object with this structure:
{
  "success": true,
  "items": [
    {
      "name": "Food Name",
      "unit": "g",
      "multiplier": 1.0,
      "base_nutrients": {
        "calories": 100,
        "protein": 5,
        "carbs": 10,
        "fats": 2
      }
    }
  ],
  "confidence": 0.95
}
Estimate weights accurately based on the photo.`,
          }, {
            inline_data: {
              mime_type: 'image/jpeg',
              data: imageBase64,
            },
          }],
        }],
        generationConfig: {
          response_mime_type: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Gemini API failed');
  }

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  
  try {
    const parsed = JSON.parse(text) as StrictNutritionResponse;
    
    // Return first item for backward compatibility
    const item = parsed.items[0];
    return {
      name: item.name,
      calories: Math.round(item.base_nutrients.calories * item.multiplier),
      protein: Math.round(item.base_nutrients.protein * item.multiplier * 10) / 10,
      carbs: Math.round(item.base_nutrients.carbs * item.multiplier * 10) / 10,
      fats: Math.round(item.base_nutrients.fats * item.multiplier * 10) / 10,
      confidence_score: parsed.confidence,
    };
  } catch {
    throw new Error('Failed to parse Gemini response');
  }
}

// Internal: NVIDIA Llama-3-Vision fallback
async function analyzeWithNVIDIA(imageBase64: string): Promise<NutritionResult> {
  const response = await fetch(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-11b-vision-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `SYSTEM INSTRUCTION: You are an expert Nutritionist API. You receive image data of meals. Do NOT provide conversational text. ONLY output valid JSON.

USER INPUT: Food Photo

YOUR TASK: Analyze the input and return a JSON object with this structure:
{
  "success": true,
  "items": [
    {
      "name": "Food Name",
      "unit": "g",
      "multiplier": 1.0,
      "base_nutrients": {
        "calories": 100,
        "protein": 5,
        "carbs": 10,
        "fats": 2
      }
    }
  ],
  "confidence": 0.95
}
Estimate weights accurately based on the photo.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 200,
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('NVIDIA API failed');
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  
  try {
    const parsed = JSON.parse(text) as StrictNutritionResponse;
    
    // Return first item for backward compatibility
    const item = parsed.items[0];
    return {
      name: item.name,
      calories: Math.round(item.base_nutrients.calories * item.multiplier),
      protein: Math.round(item.base_nutrients.protein * item.multiplier * 10) / 10,
      carbs: Math.round(item.base_nutrients.carbs * item.multiplier * 10) / 10,
      fats: Math.round(item.base_nutrients.fats * item.multiplier * 10) / 10,
      confidence_score: parsed.confidence,
    };
  } catch {
    throw new Error('Failed to parse NVIDIA response');
  }
}
