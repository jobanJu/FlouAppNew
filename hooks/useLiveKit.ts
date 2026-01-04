import { useCallback, useState } from 'react';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

interface LiveKitConfig {
  url: string;
  backendUrl: string;
}

const getLiveKitConfig = (): LiveKitConfig => {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  
  const url = process.env.LIVEKIT_URL || extra?.LIVEKIT_URL || 'wss://flouapp-mejnaydh.livekit.cloud';
  const backendUrl = process.env.BACKEND_URL || extra?.BACKEND_URL || 'http://localhost:3001';

  if (!url || !backendUrl) {
    console.error('LiveKit configuration manquante');
  }

  return { url, backendUrl };
};

/**
 * Hook pour gérer les connexions LiveKit
 * Récupère les tokens depuis le backend
 */
export const useLiveKit = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = getLiveKitConfig();

  /**
   * Récupère un token d'accès depuis le backend
   */
  const generateToken = useCallback(
    async (
      roomName: string,
      userName: string,
      canPublish: boolean = true,
      canPublishData: boolean = true
    ): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);

        // Appel API au backend pour générer le token
        // Récupère le token d'accès Supabase et l'envoie dans Authorization
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = (sessionData as any)?.session?.access_token;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

        const response = await fetch(`${config.backendUrl}/api/livekit/token`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            roomName,
            userName,
            canPublish,
            canPublishData,
            canSubscribe: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`Erreur serveur: ${response.status}`);
        }

        const { token } = await response.json();
        console.log('✅ Token LiveKit généré pour:', roomName);
        
        return token;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur token LiveKit';
        setError(message);
        console.error('❌ Erreur LiveKit token:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [config.backendUrl]
  );

  /**
   * Lance une nouvelle salle Live
   */
  const createLiveRoom = useCallback(
    async (userId: string, userName: string) => {
      const roomName = `live-${userId}-${Date.now()}`;
      const token = await generateToken(roomName, userName, true, true);
      
      if (!token) {
        return null;
      }

      return {
        roomName,
        token,
        url: config.url,
        userName,
        isHost: true,
      };
    },
    [generateToken, config.url]
  );

  /**
   * Rejoint une salle Live existante
   */
  const joinLiveRoom = useCallback(
    async (roomName: string, userName: string, isHost: boolean = false) => {
      const token = await generateToken(roomName, userName, isHost, true);
      
      if (!token) {
        return null;
      }

      return {
        roomName,
        token,
        url: config.url,
        userName,
        isHost,
      };
    },
    [generateToken, config.url]
  );

  return {
    loading,
    error,
    config,
    generateToken,
    createLiveRoom,
    joinLiveRoom,
  };
};

export default useLiveKit;
