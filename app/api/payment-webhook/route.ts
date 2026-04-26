import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-webhook-signature');

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_WEBHOOK_SECRET!)
      .update(JSON.stringify(body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { order_id, order_status, payment_amount } = body;

    if (order_status === 'PAID') {
      // Get subscription details
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', order_id)
        .single();

      if (subscription && subscription.status === 'pending') {
        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString(),
            payment_completed_at: new Date().toISOString()
          })
          .eq('id', order_id);

        // Update user's subscription plan in profiles
        await supabase
          .from('profiles')
          .update({ 
            subscription_plan: subscription.plan_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.user_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
