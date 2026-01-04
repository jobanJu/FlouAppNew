import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassCard from '../../components/GlassCard';
import theme from '../../constants/theme';

export default function QuickEditProfileScreen() {
  const router = useRouter();
  const [bio, setBio] = useState('Chercheur de vraies connexions • Surfeur passion 🏄');
  const [location, setLocation] = useState('Paris');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      Alert.alert('✅ Profil mis à jour!', 'Tes changements ont été sauvegardés.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Éditer Profil</Text>
          <View style={styles.spacer} />
        </View>

        {/* Bio Section */}
        <GlassCard style={styles.section} intensity={30}>
          <Text style={styles.sectionLabel}>💬 Bio</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Décris-toi..."
            placeholderTextColor={theme.colors.textMuted}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={150}
            editable={!loading}
          />
          <Text style={styles.charCount}>
            {bio.length}/150
          </Text>
        </GlassCard>

        {/* Location Section */}
        <GlassCard style={styles.section} intensity={30}>
          <Text style={styles.sectionLabel}>📍 Localisation</Text>
          <TextInput
            style={styles.input}
            placeholder="Ville"
            placeholderTextColor={theme.colors.textMuted}
            value={location}
            onChangeText={setLocation}
            editable={!loading}
          />
        </GlassCard>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>💾 Sauvegarder</Text>
          )}
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ Tes modifications seront visibles instantanément sur ton profil.
          </Text>
        </View>

        <View style={styles.spacer20} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.dark,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.dark,
  },
  spacer: {
    width: 44,
  },
  section: {
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
  },
  textarea: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 6,
    textAlign: 'right',
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  infoBox: {
    backgroundColor: theme.colors.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  spacer20: {
    height: 20,
  },
});
