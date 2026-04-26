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
    const { userId, type } = await req.json()

    if (!userId || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user's subscription plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const plan = profile.subscription_plan || 'free'

    // Plan limits
    const PLAN_LIMITS = {
      free: { photos: 0, chats: 5 },
      '99': { photos: 5, chats: 10 },
      '299': { photos: 50, chats: 500 },
      '499': { photos: 100, chats: 1000 },
      '999': { photos: -1, chats: -1 }, // Unlimited
    }

    const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS][type === 'photo' ? 'photos' : 'chats']

    // Unlimited plans
    if (limit === -1) {
      return new Response(
        JSON.stringify({ allowed: true, current: 0, limit: -1, plan }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get today's usage
    const today = new Date().toISOString().split('T')[0]
    const { data: usage, error: usageError } = await supabase
      .from('usage_limits')
      .select('photo_count, chat_count')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (usageError && usageError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({ error: 'Failed to check usage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const current = usage ? (type === 'photo' ? usage.photo_count : usage.chat_count) : 0
    const allowed = current < limit

    return new Response(
      JSON.stringify({ allowed, current, limit, plan }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
