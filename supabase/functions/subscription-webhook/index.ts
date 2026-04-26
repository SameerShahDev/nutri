import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { event_type, data } = body

    // Verify webhook signature
    const signature = req.headers.get('x-webhook-signature')
    const secret = Deno.env.get('CASHFREE_WEBHOOK_SECRET')!
    const textEncoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureData = await crypto.subtle.sign(
      'HMAC',
      key,
      textEncoder.encode(JSON.stringify(body))
    )
    const expectedSignature = Array.from(new Uint8Array(signatureData))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    if (signature !== expectedSignature) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event_type) {
      case 'SUBSCRIPTION_ACTIVATED': {
        const { subscription_id, customer_id } = data
        
        // Get subscription from our database
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('cashfree_subscription_id', subscription_id)
          .single()

        if (subscription) {
          // Update subscription status
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id)

          // Update user's subscription plan
          await supabase
            .from('profiles')
            .update({ 
              subscription_plan: subscription.plan_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.user_id)
        }
        break
      }

      case 'PAYMENT_SUCCESS': {
        const { subscription_id, payment_amount } = data
        
        // Get subscription from our database
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('cashfree_subscription_id', subscription_id)
          .single()

        if (subscription) {
          // Update next billing date
          const nextBillingDate = new Date()
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
          
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'active',
              next_billing_date: nextBillingDate.toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id)

          // Ensure user's plan is still active
          await supabase
            .from('profiles')
            .update({ 
              subscription_plan: subscription.plan_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.user_id)
        }
        break
      }

      case 'PAYMENT_FAILED': {
        const { subscription_id } = data
        
        // Get subscription from our database
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('cashfree_subscription_id', subscription_id)
          .single()

        if (subscription) {
          // Auto-downgrade user to free plan
          await supabase
            .from('profiles')
            .update({ 
              subscription_plan: 'free',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.user_id)

          // Update subscription status
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id)
        }
        break
      }

      case 'SUBSCRIPTION_CANCELLED': {
        const { subscription_id } = data
        
        // Get subscription from our database
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('cashfree_subscription_id', subscription_id)
          .single()

        if (subscription) {
          // Auto-downgrade user to free plan
          await supabase
            .from('profiles')
            .update({ 
              subscription_plan: 'free',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.user_id)

          // Update subscription status
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id)
        }
        break
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
