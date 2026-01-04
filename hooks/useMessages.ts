/**
 * hooks/useMessages.ts
 * 
 * Hook pour gérer les messages avec Supabase en temps réel
 * Compte automatiquement et détecte les seuils de déverrouillage
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Match {
  id: string;
  user_1: string;
  user_2: string;
  status: 'day1' | 'day2' | 'day3' | 'unmatched' | 'blocked';
  messages_count: number;
  created_at: string;
  day1_unblurred_at?: string;
  day3_unblurred_at?: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, senderId: string) => Promise<boolean>;
  markAsRead: (messageId: string) => Promise<void>;
  messagesCount: number;
}

/**
 * Hook pour les messages d'un match
 */
export const useMessages = (matchId: string): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Charger les messages existants
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (err) throw err;
      setMessages(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  // 2. Subscribe aux changements temps réel
  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, loadMessages]);

  // 3. Envoyer un message
  const sendMessage = async (
    content: string,
    senderId: string
  ): Promise<boolean> => {
    try {
      const { error: err } = await supabase.from('messages').insert({
        match_id: matchId,
        sender_id: senderId,
        content,
      });

      if (err) throw err;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur envoi';
      setError(message);
      return false;
    }
  };

  // 4. Marquer comme lu
  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);
    } catch (err) {
      console.error('Erreur mark as read:', err);
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    messagesCount: messages.length,
  };
};

/**
 * Hook pour surveiller les changements de statut du match
 * via les messages
 */
export const useMatchBlurMonitor = (match: Match) => {
  const messages = useMessages(match.id);

  // Calculer le niveau de flou basé sur le nombre de messages
  const blurLevel = messages.messagesCount >= 12 ? 0 : messages.messagesCount >= 6 ? 50 : 100;
  const nextThreshold = messages.messagesCount >= 12 ? null : messages.messagesCount >= 6 ? 12 : 6;
  const unlockProgress = nextThreshold ? Math.min(100, (messages.messagesCount / nextThreshold) * 100) : 100;
  const unlockMessage = 
    messages.messagesCount >= 12 ? '✅ Photo déverrouillée J3!' :
    messages.messagesCount >= 6 ? `⏳ J2 - ${12 - messages.messagesCount} messages pour J3` :
    `🌫️ J1 - ${6 - messages.messagesCount} messages pour J2`;

  return {
    ...messages,
    blurLevel,
    nextThreshold,
    unlockProgress,
    unlockMessage,
    statusChanged: match.status !== 'day1',
  };
};

export default useMessages;
