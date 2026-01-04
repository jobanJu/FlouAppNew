import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Alert, Text } from 'react-native';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { LiveKitRoom } from '@livekit/react-native';
import { useLiveKit } from '@/hooks/useLiveKit';

/**
 * LiveKitIntegration
 * Composant pour intégrer LiveKit avec les permissions caméra/microphone
 */
export const LiveKitIntegration = ({
  roomName,
  userName,
  token,
  serverUrl,
}: {
  roomName: string;
  userName: string;
  token: string;
  serverUrl: string;
}) => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      // Demander les permissions
      const cameraStatus = await requestCameraPermission();
      const micStatus = await requestMicrophonePermission();

      if (cameraStatus.granted && micStatus.granted) {
        console.log('✅ Permissions caméra et micro accordées');
        setIsReady(true);
      } else {
        Alert.alert(
          'Permissions requises',
          'Caméra et micro sont nécessaires pour le live',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Erreur permissions:', error);
    }
  };

  if (!isReady || !cameraPermission?.granted || !microphonePermission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Text style={styles.permissionIcon}>🔒</Text>
          <Text style={styles.permissionText}>
            Accès caméra et microphone requis
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.liveKitRoom}>
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect={true}
        audio={true}
        video={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  liveKitRoom: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  permissionContent: {
    alignItems: 'center',
    gap: 12,
  },
  permissionIcon: {
    fontSize: 48,
  },
  permissionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});
