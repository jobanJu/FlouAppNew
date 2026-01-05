// supabase/functions/update-match-status/index.ts
//
// Edge Function Supabase
// Déclenchée après chaque message
// Règles FLOU :
// - J2 = 3 messages minimum PAR UTILISATEUR
// - J3 = 6 messages minimum PAR UTILISATEUR
// - Au J3 : création automatique de la demande de partage de réseau

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const supabaseUrl = 'https://lyqtupcjevgxpovzevcz.supabase.co'
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 🔒 RÈGLES FLOU (FIGÉES)
const J2_MIN_MESSAGES = 3
const J3_MIN_MESSAGES = 6

serve(async (req: Request) => {
  try {
    // 🔐 Sécurité minimale
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const payload = await req.json()

    if (!payload?.record?.match_id) {
      return new Response('Missing match_id', { status: 400 })
    }

    const matchId = payload.record.match_id

    // 1️⃣ Récupération du match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        status,
        user_1,
        user_2,
        day2_unlocked_at,
        day3_unlocked_at
      `)
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      console.error('Match not found', matchError)
      return new Response('Match not found', { status: 404 })
    }

    // ⛔ Déjà au stade final → inutile de continuer
    if (match.status === 'day3') {
      return new Response(JSON.stringify({ status: 'day3' }), { status: 200 })
    }

    // 2️⃣ Récupération des messages et comptage PAR UTILISATEUR (plus fiable)
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('match_id', matchId)

    if (messagesError || !messagesData) {
      console.error('Error fetching messages', messagesError)
      return new Response('Error fetching messages', { status: 500 })
    }

    const countsMap: Record<string, number> = {}
    for (const m of messagesData as Array<{ sender_id: string }>) {
      const sid = m.sender_id
      countsMap[sid] = (countsMap[sid] ?? 0) + 1
    }

    const user1Count = countsMap[match.user_1] ?? 0
    const user2Count = countsMap[match.user_2] ?? 0

    let newStatus = match.status

    // 3️⃣ LOGIQUE DE DÉFLOUTAGE (ANTI-FLOOD)
    if (
      match.status === 'day1' &&
      user1Count >= J2_MIN_MESSAGES &&
      user2Count >= J2_MIN_MESSAGES
    ) {
      newStatus = 'day2'
    }

    if (
      match.status === 'day2' &&
      user1Count >= J3_MIN_MESSAGES &&
      user2Count >= J3_MIN_MESSAGES
    ) {
      newStatus = 'day3'
    }

    // 4️⃣ Mise à jour du match si nécessaire
    if (newStatus !== match.status) {
      const updateData: Record<string, any> = { status: newStatus }

      if (newStatus === 'day2') {
        updateData.day2_unlocked_at = new Date().toISOString()
      }

      if (newStatus === 'day3') {
        updateData.day3_unlocked_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId)

      if (updateError) {
        console.error('Error updating match', updateError)
        return new Response('Error updating match', { status: 500 })
      }

      console.log(
        `🌫️ Match ${matchId} : ${match.status} → ${newStatus} (U1:${user1Count} / U2:${user2Count})`
      )
    }

    // 5️⃣ JOUR 3 → CRÉATION DE LA DEMANDE DE PARTAGE DE RÉSEAU
    if (newStatus === 'day3') {
      const { data: existingRequests } = await supabase
        .from('match_social_requests')
        .select('id')
        .eq('match_id', matchId)

      // ⚠️ Anti-doublon
      if (!existingRequests || existingRequests.length < 2) {
        const requests = [
          {
            match_id: matchId,
            owner_user_id: match.user_1,
            target_user_id: match.user_2,
            social_type: 'instagram',
            social_value: '',
            consent: null,
          },
          {
            match_id: matchId,
            owner_user_id: match.user_2,
            target_user_id: match.user_1,
            social_type: 'instagram',
            social_value: '',
            consent: null,
          },
        ]

        const { error: requestError } = await supabase
          .from('match_social_requests')
          .insert(requests)

        if (requestError) {
          console.error('Error creating social requests', requestError)
        } else {
          console.log(`🔓 Social share requests created for match ${matchId}`)
        }
      }
    }

    // 6️⃣ Réponse finale
    return new Response(
      JSON.stringify({
        success: true,
        matchId,
        status: newStatus,
        messages: {
          user1: user1Count,
          user2: user2Count,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Unexpected error', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
