import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import BulleProfilFlou from '@/components/BulleProfilFlou';

export default function ProfileScreen() {
  const [userData] = useState({
    prenom: 'Thomas',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    relation: 'Feeling',
    descMots: 'Curieux, Spontané, Mélomane, Voyageur',
    descEmojis: '🎸 🏔️ 🍻',
    interets: 'Musique, Randonnée, Photo, Sushi',
    isMatched: true,
    city: 'Paris',
    status: 'Défloutage partiel',
    stats: { matches: 12, likes: 34, lives: 3 },
  });
  const [publicPreview, setPublicPreview] = useState(false);
  const router = useRouter();

  const blurIntensity = publicPreview ? 80 : 40;

  const getRelationBadge = (type) => {
    let label = '';
    let color = '#fff';
    switch (type) {
      case 'Fun':
        label = '🚫 Rien de sérieux';
        color = '#FF6B6B';
        break;
      case 'Feeling':
        label = '✨ Au Feeling';
        color = '#4ECDC4';
        break;
      case 'Serieux':
        label = '💍 Sérieux';
        color = '#FFE66D';
        break;
      default:
        label = type;
    }
    return (
      <View style={[styles.badgeContainer, { borderColor: color }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#ffe9f2", "#fff5e6", "#f7fbff"]} style={StyleSheet.absoluteFill} />
      <BlurView intensity={blurIntensity} tint="light" style={StyleSheet.absoluteFill} />

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.avatarWrapper}>
            <BulleProfilFlou imageUrl={userData.photo} />
            <BlurView intensity={publicPreview ? 85 : 45} tint="light" style={StyleSheet.absoluteFillObject} />
          </View>
          <View style={styles.identityBlock}>
            <View style={styles.nameLine}>
              <Text style={styles.name}>{userData.prenom}</Text>
              <Text style={styles.age}>{userData.age}</Text>
            </View>
            <Text style={styles.city}>{userData.city}</Text>
            <View style={styles.badgeRow}>
              {getRelationBadge(userData.relation)}
              {userData.status ? (
                <View style={[styles.badgeContainer, { borderColor: '#6dd3c0', backgroundColor: 'rgba(109,211,192,0.12)' }]}>
                  <Text style={[styles.badgeText, { color: '#6dd3c0' }]}>{userData.status}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Matchs" value={userData.stats.matches} />
          <Stat label="Likes" value={userData.stats.likes} />
          <Stat label="Lives" value={userData.stats.lives} />
        </View>

        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.emojiPill}
            onPress={() => setPublicPreview((p) => !p)}
          >
            <Text style={styles.emojiPillText}>{publicPreview ? '◻' : '◉'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.emojiPill, styles.emojiPillPrimary]}
            onPress={() => router.push('/settings/edit-profile')}
          >
            <Text style={[styles.emojiPillText, styles.emojiPillTextPrimary]}>✎</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{userData.descMots}</Text>
          <Text style={styles.emojis}>{userData.descEmojis}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Centres d&apos;intérêt</Text>
          <View style={styles.tagsWrap}>
            {userData.interets.split(',').map((tag, idx) => (
              <View key={idx} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag.trim()}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.emojiCircle, { backgroundColor: '#fff0f5', borderColor: '#e12d64' }]}
            onPress={() => Alert.alert('Déflouter', 'Défloutage partiel')}
          >
            <Text style={[styles.emojiCircleText, { color: '#e12d64' }]}>◻</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.emojiCircle, { backgroundColor: '#ff5f8f', borderColor: '#ff5f8f' }]}
            onPress={() => Alert.alert('Message', 'Ouvrir la messagerie')}
          >
            <Text style={[styles.emojiCircleText, { color: '#fff' }]}>✉</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footerActions}>
        <TouchableOpacity
          style={[styles.roundBtn, { backgroundColor: '#ffffff' }]}
          onPress={() => Alert.alert('Ignore', 'Profil ignoré')}
        >
          <Text style={{ fontSize: 28 }}>❌</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roundBtn, { backgroundColor: '#6dd3c0' }]}
          onPress={() => Alert.alert('Like', 'Profil liké')}
        >
          <Text style={{ fontSize: 28, color: '#0c0c0f' }}>❤️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f5ff', justifyContent: 'center', alignItems: 'center' },
  card: {
    width: '92%',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,105,180,0.16)',
    padding: 18,
    gap: 16,
    shadowColor: '#ff7aa2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  },
  headerRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,105,180,0.35)',
  },
  identityBlock: { flex: 1, gap: 6 },
  nameLine: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  name: { color: '#1a1a1a', fontSize: 26, fontWeight: '800' },
  age: { color: '#40475f', fontSize: 18, fontWeight: '700', marginBottom: 2 },
  city: { color: '#58607a', fontSize: 14 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badgeContainer: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,105,180,0.12)',
    borderColor: 'rgba(255,105,180,0.32)',
  },
  badgeText: { fontWeight: '700', fontSize: 12, letterSpacing: 0.2, color: '#d5286a' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,105,180,0.14)',
    alignItems: 'center',
    gap: 4,
  },
  statValue: { color: '#20263a', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#58607a', fontSize: 12, letterSpacing: 0.4 },
  section: { gap: 8 },
  sectionTitle: { color: '#38405a', fontWeight: '700', letterSpacing: 0.3, fontSize: 13, textTransform: 'uppercase' },
  bio: { color: '#1f2433', fontSize: 16, lineHeight: 22 },
  emojis: { color: '#d5286a', fontSize: 18 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: '#fff0f5', borderWidth: 1, borderColor: '#ffc1d8' },
  tagText: { color: '#d5286a', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  controlRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  emojiPill: {
    width: 64,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e12d64',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  emojiPillPrimary: { backgroundColor: '#ff5f8f', borderColor: '#ff5f8f' },
  emojiPillText: { color: '#1f2433', fontWeight: '900', fontSize: 18, lineHeight: 22, textAlign: 'center' },
  emojiPillTextPrimary: { color: '#fff' },
  emojiCircle: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e12d64',
  },
  emojiCircleText: { fontSize: 26, fontWeight: '900', lineHeight: 28, textAlign: 'center' },
  emojiCircleLabel: { color: '#1f2433', fontWeight: '800', fontSize: 13 },
  footerActions: { flexDirection: 'row', gap: 20, marginTop: 18 },
  roundBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff7aa2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
});