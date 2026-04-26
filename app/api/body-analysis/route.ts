import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function analyzeWithNVIDIA(bodyData: any): Promise<any> {
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
            content: 'You are a fitness expert. Calculate TDEE (Total Daily Energy Expenditure) and generate a personalized 7-day micro-plan. Return strict JSON with: tdee, recommended_water (ml), protein_target (g), and exercises (array of 3 calisthenics exercises with name, sets, reps).',
          },
          {
            role: 'user',
            content: `Analyze this body data: Age: ${bodyData.age}, Weight: ${bodyData.weight}kg, Height: ${bodyData.height}cm, Gender: ${bodyData.gender}, Goal: ${bodyData.goal}. Calculate TDEE and provide recommendations.`,
          },
        ],
        max_tokens: 500,
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
    const { age, weight, height, gender, goal } = await request.json();

    // Get user from session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user's subscription plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();

    const plan = profile?.subscription_plan || 'free';

    // Only allow body analysis for paid plans (99, 299, 499, 999)
    if (plan === 'free') {
      return NextResponse.json(
        { 
          error: 'LIMIT_EXCEEDED',
          message: 'Body analysis is a premium feature. Upgrade to Basic plan or higher!',
        },
        { status: 403 }
      );
    }

    // Call NVIDIA for body analysis
    const analysis = await analyzeWithNVIDIA({ age, weight, height, gender, goal });

    // Save to body_reports table
    const { error: insertError } = await supabase.from('body_reports').insert({
      user_id: user.id,
      age,
      weight,
      height,
      gender,
      goal,
      tdee: analysis.tdee,
      recommended_water: analysis.recommended_water,
      protein_target: analysis.protein_target,
      exercises: analysis.exercises,
    });

    if (insertError) {
      console.error('Error saving body report:', insertError);
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Body analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
