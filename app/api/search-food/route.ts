import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface StrictNutritionResponse {
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

// Search in local database first (fast, no API cost)
async function searchInDatabase(query: string): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('master_nutrients')
      .select('*')
      .or(`name.ilike.%${query}%,search_terms.cs.{${query}}`)
      .limit(5);

    if (error || !data || data.length === 0) {
      return null;
    }

    // Transform database results to match API format (per-gram values)
    return data.map(item => ({
      name: item.name,
      calories_per_gram: item.calories_per_gram,
      protein_per_gram: item.protein_per_gram,
      carbs_per_gram: item.carbs_per_gram,
      fats_per_gram: item.fats_per_gram,
    }));
  } catch (error) {
    console.error('Database search error:', error);
    return null;
  }
}

// Fallback to Gemini API (costs money)
async function searchWithGemini(query: string): Promise<any> {
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
  
  try {
    const parsed = JSON.parse(text) as StrictNutritionResponse;
    
    // Convert strict format to per-gram values for consistent scaling
    const results = parsed.items.map(item => {
      const totalCalories = item.base_nutrients.calories * item.multiplier;
      const totalProtein = item.base_nutrients.protein * item.multiplier;
      const totalCarbs = item.base_nutrients.carbs * item.multiplier;
      const totalFats = item.base_nutrients.fats * item.multiplier;
      
      // Convert to per-gram (assuming multiplier represents grams)
      const grams = item.multiplier;
      
      return {
        name: item.name,
        calories_per_gram: Math.round((totalCalories / grams) * 100) / 100,
        protein_per_gram: Math.round((totalProtein / grams) * 100) / 100,
        carbs_per_gram: Math.round((totalCarbs / grams) * 100) / 100,
        fats_per_gram: Math.round((totalFats / grams) * 100) / 100,
        confidence_score: parsed.confidence,
      };
    });
    
    // Cache results to database for future use
    await cacheResultsToDatabase(results);
    
    return { results, source: 'ai' };
  } catch {
    throw new Error('Failed to parse Gemini response');
  }
}

// Cache AI results to database (store per-gram values)
async function cacheResultsToDatabase(results: any[]): Promise<void> {
  try {
    for (const item of results) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('master_nutrients')
        .select('id')
        .ilike('name', item.name)
        .limit(1);

      if (!existing || existing.length === 0) {
        // Insert new item with per-gram values
        await supabase.from('master_nutrients').insert({
          name: item.name,
          calories_per_gram: item.calories_per_gram,
          protein_per_gram: item.protein_per_gram,
          carbs_per_gram: item.carbs_per_gram,
          fats_per_gram: item.fats_per_gram,
          search_terms: [item.name.toLowerCase()],
        });
      }
    }
  } catch (error) {
    console.error('Cache error:', error);
    // Don't fail the request if caching fails
  }
}

// Scale nutrients based on user's quantity (per-gram based)
function scaleNutrients(baseItem: any, userQuantity: number): any {
  // Since we store per-gram values, scaling is simple multiplication
  return {
    name: baseItem.name,
    calories: Math.round(baseItem.calories_per_gram * userQuantity),
    protein: Math.round(baseItem.protein_per_gram * userQuantity * 10) / 10,
    carbs: Math.round(baseItem.carbs_per_gram * userQuantity * 10) / 10,
    fats: Math.round(baseItem.fats_per_gram * userQuantity * 10) / 10,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { query, quantity, unit } = await request.json();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Step 1: Try database first (instant, no API cost)
    const dbResults = await searchInDatabase(query);
    
    if (dbResults && dbResults.length > 0) {
      // Scale if quantity provided
      const scaledResults = quantity
        ? dbResults.map(item => scaleNutrients(item, quantity))
        : dbResults;
      
      return NextResponse.json({ results: scaledResults, source: 'database' });
    }

    // Step 2: Fallback to Gemini API (costs money)
    const aiResults = await searchWithGemini(query);
    return NextResponse.json(aiResults);
  } catch (error) {
    console.error('Food search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
