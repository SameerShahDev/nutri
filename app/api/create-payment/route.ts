import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json();

    // Get user from session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Plan prices
    const planPrices: Record<string, number> = {
      '99': 99,
      '299': 299,
      '499': 499,
      '999': 999,
    };

    const amount = planPrices[planId];
    if (!amount) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Create Cashfree order
    const orderId = `order_${Date.now()}_${user.id.slice(0, 8)}`;

    const cashfreeResponse = await fetch(
      `${process.env.CASHFREE_API_URL}/orders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CASHFREE_API_KEY!,
          'x-client-id': process.env.CASHFREE_APP_ID!,
          'x-client-secret': process.env.CASHFREE_API_SECRET!,
        },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: amount,
          order_currency: 'INR',
          customer_details: {
            customer_id: user.id,
            customer_email: user.email,
            customer_name: user.user_metadata?.full_name || 'User',
          },
          order_meta: {
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?status=success`,
            notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment-webhook`,
            payment_methods: 'card,upi,netbanking',
          },
        }),
      }
    );

    if (!cashfreeResponse.ok) {
      const error = await cashfreeResponse.text();
      console.error('Cashfree error:', error);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const cashfreeData = await cashfreeResponse.json();

    // Store order in Supabase
    await supabase.from('orders').insert({
      id: orderId,
      user_id: user.id,
      plan_id: planId,
      amount: amount,
      status: 'pending',
      payment_session_id: cashfreeData.payment_session_id,
    });

    return NextResponse.json({
      paymentSessionId: cashfreeData.payment_session_id,
      orderId,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
