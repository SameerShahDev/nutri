import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function checkUsageLimit(userId: string, type: 'photo' | 'chat'): Promise<{ allowed: boolean; current: number; limit: number; plan: string }> {
  // Call Supabase Edge Function for server-side validation
  const { data, error } = await supabase.functions.invoke('verify-subscription', {
    body: { userId, type },
  });

  if (error) {
    console.error('Edge function error:', error);
    return { allowed: false, current: 0, limit: 0, plan: 'free' };
  }

  return data;
}

async function incrementUsage(userId: string, type: 'photo' | 'chat'): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const column = type === 'photo' ? 'photo_count' : 'chat_count';

  const { data: existing } = await supabase
    .from('usage_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (existing) {
    await supabase
      .from('usage_limits')
      .update({ [column]: (existing as any)[column] + 1, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('date', today);
  } else {
    await supabase
      .from('usage_limits')
      .insert({
        user_id: userId,
        date: today,
        [column]: 1,
      });
  }
}

async function chatWithGemini(message: string, history: Array<{ role: string; content: string }>): Promise<string> {
  const messages = [
    {
      role: 'system',
      parts: [{ text: 'You are a fitness and nutrition coach. Provide helpful, accurate advice about diet, exercise, and healthy living. Keep responses concise and actionable.' }],
    },
    ...history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Gemini API failed');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function chatWithNVIDIA(message: string, history: Array<{ role: string; content: string }>): Promise<string> {
  const messages = [
    {
      role: 'system',
      content: 'You are a fitness and nutrition coach. Provide helpful, accurate advice about diet, exercise, and healthy living. Keep responses concise and actionable.',
    },
    ...history,
    {
      role: 'user',
      content: message,
    },
  ];

  const response = await fetch(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-3b-instruct',
        messages,
        max_tokens: 500,
        temperature: 0.7,
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
    const { message, history = [] } = await request.json();

    // Get user from session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Server-side usage check via Edge Function (bulletproof)
    const checkResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/check-usage`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'chat',
          user_id: user.id,
        }),
      }
    );

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json();
      return NextResponse.json(
        { 
          error: 'LIMIT_EXCEEDED',
          message: 'Limit khatam bhai, upgrade kar lo!',
          plan: errorData.plan,
          current: errorData.current,
          limit: errorData.limit,
        },
        { status: 403 }
      );
    }

    const checkData = await checkResponse.json();
    if (!checkData.allowed) {
      return NextResponse.json(
        { 
          error: 'LIMIT_EXCEEDED',
          message: 'Limit khatam bhai, upgrade kar lo!',
          plan: checkData.plan,
          current: checkData.current,
          limit: checkData.limit,
        },
        { status: 403 }
      );
    }

    // Use NVIDIA Llama-3-70B with streaming
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are Coach Arnie, a friendly, motivational fitness coach from Igone. Speak Hinglish. Focus on calisthenics, hydration, and nutrition. Keep answers precise and concise.',
        },
        ...history.map((msg: { role: string; content: string }) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        {
          role: 'user',
          content: message,
        },
      ];

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
            messages,
            max_tokens: 500,
            temperature: 0.7,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('NVIDIA API failed');
      }

      // Increment usage
      await incrementUsage(user.id, 'chat');

      // Stream the response
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    const text = parsed.choices?.[0]?.delta?.content;
                    if (text) {
                      controller.enqueue(encoder.encode(text));
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    } catch (nvidiaError) {
      console.error('NVIDIA failed:', nvidiaError);
      
      // Fallback to Gemini with streaming
      try {
        const messages = [
          {
            role: 'system',
            parts: [{ text: 'You are Coach Arnie, a friendly, motivational fitness coach from Igone. Speak Hinglish. Focus on calisthenics, hydration, and nutrition. Keep answers precise and concise.' }],
          },
          ...history.map((msg: { role: string; content: string }) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          })),
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ];

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: messages,
              generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Gemini API failed');
        }

        // Increment usage
        await incrementUsage(user.id, 'chat');

        // Stream the response
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const stream = new ReadableStream({
          async start(controller) {
            const reader = response.body?.getReader();
            if (!reader) {
              controller.close();
              return;
            }

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  controller.close();
                  break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    try {
                      const parsed = JSON.parse(data);
                      const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (text) {
                        controller.enqueue(encoder.encode(text));
                      }
                    } catch (e) {
                      // Skip invalid JSON
                    }
                  }
                }
              }
            } catch (error) {
              controller.error(error);
            }
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          },
        });
      } catch (geminiError) {
        console.error('Gemini failed:', geminiError);
        return NextResponse.json(
          { error: 'Both AI providers failed' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
