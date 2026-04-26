import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { name, calories, protein, carbs, fats } = await request.json();

    // Get user from session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Save to daily_logs
    const { error } = await supabase.from('daily_logs').insert({
      user_id: user.id,
      food_name: name,
      calories,
      macros: {
        protein: protein || 0,
        carbs: carbs || 0,
        fats: fats || 0,
      },
      type: 'manual',
    });

    if (error) {
      console.error('Error adding food:', error);
      return NextResponse.json(
        { error: 'Failed to add food' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add food error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
