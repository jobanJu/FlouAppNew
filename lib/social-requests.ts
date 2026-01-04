/**
 * lib/social-requests.ts
 * Gestion des demandes de partage de réseaux sociaux
 */

import { supabase } from './supabase';

export interface SocialRequest {
  id: string;
  match_id: string;
  owner_user_id: string;
  target_user_id: string;
  social_type: 'instagram' | 'snapchat';
  social_value: string | null;
  consent: boolean | null; // null = pending, true = accepted, false = declined
  requested_at: string;
  answered_at: string | null;
}

/**
 * Récupère les demandes sociales pour l'utilisateur actuel
 */
export const getPendingSocialRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('match_social_requests')
    .select('*')
    .eq('target_user_id', userId)
    .is('consent', null);

  if (error) throw error;
  return data as SocialRequest[];
};

/**
 * Accepte une demande sociale et partage le contact
 */
export const acceptSocialRequest = async (
  requestId: string,
  socialValue: string
) => {
  const { error } = await supabase
    .from('match_social_requests')
    .update({
      consent: true,
      social_value: socialValue,
      answered_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;
};

/**
 * Refuse une demande sociale
 */
export const declineSocialRequest = async (requestId: string) => {
  const { error } = await supabase
    .from('match_social_requests')
    .update({
      consent: false,
      answered_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) throw error;
};

/**
 * Récupère les contacts sociaux acceptés pour un match
 */
export const getSharedSocials = async (
  matchId: string,
  userId: string
) => {
  const { data, error } = await supabase
    .from('match_social_requests')
    .select('*')
    .eq('match_id', matchId)
    .eq('owner_user_id', userId)
    .eq('consent', true);

  if (error) throw error;
  
  const socials: { [key: string]: string } = {};
  (data as SocialRequest[]).forEach(req => {
    if (req.social_value) {
      socials[req.social_type] = req.social_value;
    }
  });
  
  return socials;
};
