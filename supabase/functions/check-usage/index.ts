import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, user_id } = await req.json()

    if (!type || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user's subscription plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user_id)
      .single()

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const plan = profile.subscription_plan || 'free'

    // Get today's usage
    const today = new Date().toISOString().split('T')[0]
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('*')
      .eq('user_id', user_id)
      .eq('date', today)
      .single()

    const currentUsage = usage || { photo_scans: 0, chat_messages: 0 }

    // Define limits per plan
    const limits = {
      free: { photo_scans: 0, chat_messages: 5 },
      starter: { photo_scans: 5, chat_messages: 10 },
      pro: { photo_scans: 50, chat_messages: 500 },
      elite: { photo_scans: 100, chat_messages: 1000 },
      unlimited: { photo_scans: Infinity, chat_messages: Infinity },
    }

    const planLimits = limits[plan as keyof typeof limits] || limits.free

    // Check if within limits
    if (type === 'photo') {
      if (currentUsage.photo_scans >= planLimits.photo_scans) {
        return new Response(
          JSON.stringify({ 
            allowed: false, 
            plan, 
            current: currentUsage.photo_scans, 
            limit: planLimits.photo_scans 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
    } else if (type === 'chat') {
      if (currentUsage.chat_messages >= planLimits.chat_messages) {
        return new Response(
          JSON.stringify({ 
            allowed: false, 
            plan, 
            current: currentUsage.chat_messages, 
            limit: planLimits.chat_messages 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }
    }

    // Allowed - increment usage
    if (usage) {
      await supabase
        .from('daily_usage')
        .update(
          type === 'photo' 
            ? { photo_scans: currentUsage.photo_scans + 1 }
            : { chat_messages: currentUsage.chat_messages + 1 }
        )
        .eq('id', usage.id)
    } else {
      await supabase
        .from('daily_usage')
        .insert({
          user_id,
          date: today,
          photo_scans: type === 'photo' ? 1 : 0,
          chat_messages: type === 'chat' ? 1 : 0,
        })
    }

    return new Response(
      JSON.stringify({ allowed: true, plan }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
