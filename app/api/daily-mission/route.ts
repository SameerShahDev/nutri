import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function generateMissionWithNVIDIA(userData: any): Promise<string> {
  const response = await fetch(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a gamified fitness coach. Generate a fun, game-like daily mission for the user. Make it exciting and achievable. Keep it under 100 characters.',
          },
          {
            role: 'user',
            content: `Generate a daily mission for a user with: Age ${userData.age}, Weight ${userData.weight}kg, Goal: ${userData.goal}. Make it sound like a game quest!`,
          },
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('NVIDIA API failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('age, weight, goal')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Generate daily mission using NVIDIA
    const mission = await generateMissionWithNVIDIA(profile);

    return NextResponse.json({ mission });
  } catch (error) {
    console.error('Daily mission error:', error);
    // Fallback mission if AI fails
    return NextResponse.json({ 
      mission: 'Today\'s Mission: Drink 8 glasses of water to level up!' 
    });
  }
}
