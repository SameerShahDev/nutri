import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function checkUsageLimit(userId: string, type: 'photo' | 'chat'): Promise<{ allowed: boolean; current: number; limit: number; plan: string }> {
  // Call Supabase Edge Function for server-side validation
  const { data, error } = await supabase.functions.invoke('verify-subscription', {
    body: { userId, type },
  });

  if (error) {
    console.error('Edge function error:', error);
    return { allowed: false, current: 0, limit: 0, plan: 'free' };
  }

  return data;
}

async function incrementUsage(userId: string, type: 'photo' | 'chat'): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const column = type === 'photo' ? 'photo_count' : 'chat_count';

  const { data: existing } = await supabase
    .from('usage_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (existing) {
    await supabase
      .from('usage_limits')
      .update({ [column]: (existing as any)[column] + 1, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('date', today);
  } else {
    await supabase
      .from('usage_limits')
      .insert({
        user_id: userId,
        date: today,
        [column]: 1,
      });
  }
}

async function analyzeWithGemini(imageBase64: string): Promise<any> {
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
    const parsed = JSON.parse(text);
    
    // Convert strict format to legacy format for backward compatibility
    if (parsed.items && parsed.items.length > 0) {
      const item = parsed.items[0];
      return {
        name: item.name,
        calories: Math.round(item.base_nutrients.calories * item.multiplier),
        protein: Math.round(item.base_nutrients.protein * item.multiplier * 10) / 10,
        carbs: Math.round(item.base_nutrients.carbs * item.multiplier * 10) / 10,
        fats: Math.round(item.base_nutrients.fats * item.multiplier * 10) / 10,
        confidence_score: parsed.confidence,
      };
    }
    
    return parsed;
  } catch {
    throw new Error('Failed to parse Gemini response');
  }
}

async function analyzeWithNVIDIA(imageBase64: string): Promise<any> {
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
                text: 'Analyze this food. Identify items, weights, and return a strict JSON with: name, calories, protein, carbs, fats, and confidence_score. Only return valid JSON, no other text.',
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
    return JSON.parse(text);
  } catch {
    throw new Error('Failed to parse NVIDIA response');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Get user from session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Server-side usage check via Edge Function (bulletproof)
    const checkResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/check-usage`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'photo',
          user_id: user.id,
        }),
      }
    );

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json();
      return NextResponse.json(
        { 
          error: 'LIMIT_EXCEEDED',
          message: 'Daily limit reached. Please upgrade your plan!',
          plan: errorData.plan,
          current: errorData.current,
          limit: errorData.limit,
        },
        { status: 403 }
      );
    }

    const checkData = await checkResponse.json();
    if (!checkData.allowed) {
      return NextResponse.json(
        { 
          error: 'LIMIT_EXCEEDED',
          message: 'Daily limit reached. Please upgrade your plan!',
          plan: checkData.plan,
          current: checkData.current,
          limit: checkData.limit,
        },
        { status: 403 }
      );
    }

    // Try Gemini first
    let result;
    try {
      result = await analyzeWithGemini(image);
    } catch (geminiError) {
      console.error('Gemini failed, trying NVIDIA:', geminiError);
      try {
        result = await analyzeWithNVIDIA(image);
      } catch (nvidiaError) {
        console.error('NVIDIA also failed:', nvidiaError);
        return NextResponse.json(
          { error: 'AI analysis failed. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Increment usage
    await incrementUsage(user.id, 'photo');

    // Save to daily_logs
    await supabase.from('daily_logs').insert({
      user_id: user.id,
      food_name: result.name || result.food_name,
      calories: result.calories,
      macros: {
        protein: result.protein,
        carbs: result.carbs,
        fats: result.fats,
      },
      type: 'ai',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Photo analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
