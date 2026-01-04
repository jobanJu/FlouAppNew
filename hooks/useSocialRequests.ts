/**
 * hooks/useSocialRequests.ts
 * Hook pour gérer les requêtes sociales
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SocialRequest } from '@/lib/social-requests';

/**
 * Hook pour charger les demandes sociales en attente
 */
export const usePendingSocialRequests = (userId: string | undefined) => {
  const [requests, setRequests] = useState<SocialRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('match_social_requests')
        .select('*')
        .eq('target_user_id', userId)
        .is('consent', null);

      if (error) throw error;
      setRequests((data || []) as SocialRequest[]);
    } catch (err) {
      console.error('Erreur loading requests:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    loadRequests();

    // Subscribe aux changements
    const channel = supabase
      .channel(`social_requests:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_social_requests',
          filter: `target_user_id=eq.${userId}`,
        },
        (payload) => {
          setRequests((prev) => [payload.new as SocialRequest, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadRequests]);

  return { requests, loading, refetch: loadRequests };
};

/**
 * Hook pour charger tous les contacts sociaux acceptés pour un match
 */
export const useSharedSocials = (matchId: string | undefined, userId: string | undefined) => {
  const [socials, setSocials] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    supabase
      .from('match_social_requests')
      .select('*')
      .eq('match_id', matchId)
      .eq('owner_user_id', userId)
      .eq('consent', true)
      .then(({ data, error }) => {
        if (error) {
          console.error('Erreur loading socials:', error);
          setLoading(false);
          return;
        }

        const socialsMap: { [key: string]: string } = {};
        (data || []).forEach((req: SocialRequest) => {
          if (req.social_value) {
            socialsMap[req.social_type] = req.social_value;
          }
        });

        setSocials(socialsMap);
        setLoading(false);
      });
  }, [matchId, userId]);

  return { socials, loading };
};

// Backwards-compatible wrapper expected by other hooks/components
export const useSocialRequests = (userId: string | undefined) => {
  const { requests, loading, refetch } = usePendingSocialRequests(userId);
  return { socialRequests: requests, loading, refetch };
};
