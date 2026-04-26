import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { planId, amount, userId, billingCycle } = await req.json();

    // Create order in Supabase
    const { data: order, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        amount: amount,
        billing_cycle: billingCycle,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Call Cashfree API to create checkout session
    const cashfreeResponse = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CASHFREE_API_KEY!,
        'x-api-secret': process.env.CASHFREE_API_SECRET!,
        'x-client-id': process.env.CASHFREE_CLIENT_ID!,
        'x-client-secret': process.env.CASHFREE_CLIENT_SECRET!,
      },
      body: JSON.stringify({
        order_id: order.id,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: userId,
          customer_email: 'user@example.com',
          customer_phone: '9999999999',
        },
        order_meta: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?order_id=${order.id}`,
          notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment-webhook`,
        },
      }),
    });

    const cashfreeData = await cashfreeResponse.json();

    if (cashfreeData.order_token) {
      return NextResponse.json({
        checkoutUrl: `https://payments.cashfree.com/order/#/pay/${cashfreeData.order_token}`,
        orderId: order.id,
      });
    }

    throw new Error('Failed to create Cashfree order');
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
