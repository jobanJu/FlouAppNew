/**
 * hooks/useMatches.ts
 * Hook pour gérer les matches avec Supabase Realtime
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Match {
  id: string;
  user_1: string;
  user_2: string;
  // Optional profile photo URL for UI components
  photo_url?: string | null;
  status: 'day1' | 'day2' | 'day3' | 'unmatched' | 'blocked';
  messages_count_user_1: number;
  messages_count_user_2: number;
  total_messages: number;
  day2_unlocked_at: string | null;
  day3_unlocked_at: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

/**
 * Hook pour charger les matches de l'utilisateur actuel
 */
export const useMatches = (userId: string | undefined) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les matches initialement
  const loadMatches = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('matches')
        .select('*')
        .or(`user_1.eq.${userId},user_2.eq.${userId}`)
        .eq('status', 'day1')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setMatches((data || []) as Match[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Subscribe aux changements temps réel
  useEffect(() => {
    if (!userId) return;

    loadMatches();

    // Subscribe aux updates sur les matches
    const channel = supabase
      .channel(`matches:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `user_1=eq.${userId},user_2=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedMatch = payload.new as Match;
            setMatches((prev) =>
              prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m))
            );
          } else if (payload.eventType === 'INSERT') {
            setMatches((prev) => [payload.new as Match, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadMatches]);

  return { matches, loading, error, refetch: loadMatches };
};

/**
 * Hook pour charger UN match spécifique
 */
export const useMatch = (matchId: string | undefined) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    setLoading(true);

    // Charger le match
    supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }
        setMatch(data as Match);
        setError(null);

        // Subscribe aux changements
        const channel = supabase
          .channel(`match:${matchId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'matches',
              filter: `id=eq.${matchId}`,
            },
            (payload) => {
              setMatch(payload.new as Match);
            }
          )
          .subscribe();

        setLoading(false);

        return () => {
          supabase.removeChannel(channel);
        };
      });
  }, [matchId]);

  return { match, loading, error };
};
