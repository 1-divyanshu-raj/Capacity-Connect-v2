// Supabase Edge Function: verify-biometric
// Secure server-side biometric vector matching without exposing templates to client

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { vector, livenessScore, email } = await req.json();

    if (!Array.isArray(vector) || vector.length < 32) {
      return new Response(JSON.stringify({ matched: false, error: 'Invalid biometric vector' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (typeof livenessScore !== 'number' || livenessScore < 0.35) {
      return new Response(JSON.stringify({ matched: false, error: 'Liveness test failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (email) {
      // 1:1 Match against specific user
      const { data: user, error: uErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, status')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (uErr || !user) {
        return new Response(JSON.stringify({ matched: false, error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (user.status !== 'active') {
        return new Response(JSON.stringify({ matched: false, error: 'Account not active' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: bio, error: bErr } = await supabase
        .from('biometrics')
        .select('template_vector')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (bErr || !bio) {
        return new Response(JSON.stringify({ matched: false, error: 'Biometrics not enrolled' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const score = cosineSimilarity(vector, bio.template_vector);
      const MATCH_THRESHOLD = 0.68;

      if (score >= MATCH_THRESHOLD) {
        await supabase
          .from('biometrics')
          .update({ last_used_at: new Date().toISOString() })
          .eq('user_id', user.id);

        return new Response(JSON.stringify({ matched: true, user, similarity: score }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ matched: false, similarity: score, error: 'Score below threshold' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 1:N Identification across all enrolled users
    const { data: allBios, error: aErr } = await supabase
      .from('biometrics')
      .select('user_id, template_vector')
      .eq('is_active', true);

    if (aErr || !allBios || allBios.length === 0) {
      return new Response(JSON.stringify({ matched: false, error: 'No enrolled biometrics' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let bestMatch: any = null;
    let highestScore = 0;
    const GLOBAL_THRESHOLD = 0.70;

    for (const bio of allBios) {
      const score = cosineSimilarity(vector, bio.template_vector);
      if (score >= GLOBAL_THRESHOLD && score > highestScore) {
        highestScore = score;
        bestMatch = bio;
      }
    }

    if (bestMatch) {
      const { data: user } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, status')
        .eq('id', bestMatch.user_id)
        .eq('status', 'active')
        .single();

      if (user) {
        return new Response(JSON.stringify({ matched: true, user, similarity: highestScore }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ matched: false, error: 'No matching facial identity found' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
