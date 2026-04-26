import { NextRequest, NextResponse } from 'next/server';

async function generateHealthTip(foodName: string, macros: any): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate a 1-sentence health tip for this food: ${foodName} (${macros.calories} kcal, ${macros.protein}g protein, ${macros.carbs}g carbs, ${macros.fats}g fats). Keep it under 50 characters and actionable.`,
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
}

export async function POST(request: NextRequest) {
  try {
    const { name, calories, protein, carbs, fats } = await request.json();

    // Generate health tip using Gemini Flash
    const tip = await generateHealthTip(name, { calories, protein, carbs, fats });

    return NextResponse.json({ tip });
  } catch (error) {
    console.error('Health tip error:', error);
    // Fallback tips if AI fails
    const fallbackTips = [
      'Drink extra water!',
      'Great choice!',
      'Stay hydrated!',
      'Balance is key!',
    ];
    return NextResponse.json({ 
      tip: fallbackTips[Math.floor(Math.random() * fallbackTips.length)] 
    });
  }
}
