/**
 * components/SocialRequestModal.tsx
 * Modal pour afficher les demandes de réseaux sociaux
 * Apparaît quand on atteint le Jour 3
 */

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { acceptSocialRequest, declineSocialRequest, SocialRequest } from '@/lib/social-requests';

interface Props {
  visible: boolean;
  request: SocialRequest | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SocialRequestModal = ({ visible, request, onClose, onSuccess }: Props) => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    if (!request || !inputValue.trim()) {
      setError('Veuillez entrer votre contact');
      return;
    }

    setLoading(true);
    try {
      await acceptSocialRequest(request.id, inputValue);
      setInputValue('');
      setError('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!request) return;

    setLoading(true);
    try {
      await declineSocialRequest(request.id);
      setInputValue('');
      setError('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const socialLabel = request?.social_type === 'instagram' ? 'Instagram' : 'Snapchat';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>✅ Photos déverrouillées!</Text>
          
          <Text style={styles.subtitle}>
            Vous avez atteint le Jour 3 🎉
          </Text>

          <View style={styles.requestBox}>
            <Text style={styles.requestText}>
              Partager mon {socialLabel}?
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder={`@username ${socialLabel}`}
              value={inputValue}
              onChangeText={setInputValue}
              editable={!loading}
              placeholderTextColor="#999"
            />

            {error && <Text style={styles.error}>{error}</Text>}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Partager</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={handleDecline}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  requestBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  requestText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
  },
  error: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#9b59b6',
  },
  declineButton: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
