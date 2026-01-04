import { useRef, useEffect } from 'react';
import { useMatches, useMatch } from './useMatches';
import { useSocialRequests } from './useSocialRequests';

interface NotificationHookRef {
  show: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  success: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
}

export const useNotifications = (toastRef: React.RefObject<NotificationHookRef>, userId: string) => {
  const { matches } = useMatches(userId);
  const prevStatusRef = useRef<{ [key: string]: string }>({});

  useEffect(() => {
    if (!matches || !toastRef.current) return;

    matches.forEach((match) => {
      const prevStatus = prevStatusRef.current[match.id];

      // Day 1 → Day 2 transition
      if (prevStatus === 'day1' && match.status === 'day2') {
        toastRef.current?.success('⏳ Status Day 2 débloqué! Continuez les messages 💬');
      }

      // Day 2 → Day 3 transition
      if (prevStatus === 'day2' && match.status === 'day3') {
        toastRef.current?.success('✅ Photo entièrement débloquée! 🎉');
      }

      prevStatusRef.current[match.id] = match.status;
    });
  }, [matches, toastRef]);
};

/**
 * Hook pour les notifications de messages
 * Déclenche une alerte quand un nouveau message arrive
 */
export const useMessageNotifications = (
  toastRef: React.RefObject<NotificationHookRef>,
  matchId: string
) => {
  const { match } = useMatch(matchId);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!match || !toastRef.current) return;

    const totalMessages = (match.messages_count_user_1 || 0) + (match.messages_count_user_2 || 0);

    if (totalMessages > prevCountRef.current) {
      toastRef.current?.info(`💬 Nouveau message! (${totalMessages} total)`);
    }

    prevCountRef.current = totalMessages;
  }, [match, toastRef]);
};

/**
 * Hook pour les notifications de demandes sociales
 */
export const useSocialRequestNotifications = (
  toastRef: React.RefObject<NotificationHookRef>,
  userId: string
) => {
  const { socialRequests } = useSocialRequests(userId);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!toastRef.current) return;

    const newRequestCount = socialRequests?.length || 0;

    if (newRequestCount > prevCountRef.current) {
      const diff = newRequestCount - prevCountRef.current;
      toastRef.current?.info(
        `📱 ${diff} nouvelle${diff > 1 ? 's' : ''} demande${diff > 1 ? 's' : ''} de partage!`
      );
    }

    prevCountRef.current = newRequestCount;
  }, [socialRequests, toastRef]);
};
