import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json();

    // Only allow subscription for ₹499 and ₹999 plans
    if (planId !== '499' && planId !== '999') {
      return NextResponse.json({ error: 'Subscription not available for this plan' }, { status: 400 });
    }

    // Get user from session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Plan details
    const planDetails: Record<string, { amount: number; name: string }> = {
      '499': { amount: 499, name: 'Elite' },
      '999': { amount: 999, name: 'Unlimited' },
    };

    const plan = planDetails[planId];

    // Create subscription link with Cashfree
    const subscriptionId = `sub_${Date.now()}_${user.id.slice(0, 8)}`;

    const cashfreeResponse = await fetch(
      `${process.env.CASHFREE_API_URL}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CASHFREE_API_KEY!,
          'x-client-id': process.env.CASHFREE_APP_ID!,
          'x-client-secret': process.env.CASHFREE_API_SECRET!,
        },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          subscription_name: `CommunityGuard ${plan.name} Plan`,
          subscription_amount: plan.amount,
          subscription_type: 'RECURRING',
          subscription_interval: 'month',
          subscription_interval_count: 1,
          customer_details: {
            customer_id: user.id,
            customer_email: user.email,
            customer_name: user.user_metadata?.full_name || 'User',
          },
          subscription_notify: {
            notify_phone: false,
            notify_email: true,
          },
          subscription_note: {
            description: `Monthly ${plan.name} subscription`,
          },
        }),
      }
    );

    if (!cashfreeResponse.ok) {
      const error = await cashfreeResponse.text();
      console.error('Cashfree subscription error:', error);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    const cashfreeData = await cashfreeResponse.json();

    // Store subscription in Supabase
    await supabase.from('subscriptions').insert({
      id: subscriptionId,
      user_id: user.id,
      plan_id: planId,
      status: 'pending',
      subscription_link_id: cashfreeData.subscription_link_id,
      cashfree_subscription_id: cashfreeData.subscription_id,
    });

    return NextResponse.json({
      subscriptionLink: cashfreeData.subscription_link,
      subscriptionId,
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
