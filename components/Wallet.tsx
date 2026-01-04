import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import GlassCard from './GlassCard';

interface WalletProps {
  brumes: number;
  onRecharge?: () => void;
  isPremium?: boolean;
}

/**
 * Wallet - Portefeuille de Brumes
 * Élément PRIORITAIRE du profil utilisateur
 * Matérialise la monnaie émotionnelle de FLOU
 */
export default function Wallet({ brumes, onRecharge, isPremium = false }: WalletProps) {
  return (
    <GlassCard style={styles.wallet} intensity={50}>
      <View style={styles.content}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Mon Portefeuille</Text>
          {isPremium && <Text style={styles.badge}>✨ Premium</Text>}
        </View>

        {/* Affichage des Brumes */}
        <View style={styles.brumeDisplay}>
          <Text style={styles.brumeIcon}>☁️</Text>
          <View style={styles.brumeText}>
            <Text style={styles.brumeValue}>{brumes}</Text>
            <Text style={styles.brumeLabel}>Brumes disponibles</Text>
          </View>
        </View>

        {/* Bouton Recharger */}
        <TouchableOpacity
          style={[styles.rechargeBtn, isPremium && styles.rechargeBtnPremium]}
          onPress={onRecharge}
        >
          <Text style={styles.rechargeText}>Recharger</Text>
        </TouchableOpacity>

        {/* Info contextuelle */}
        <Text style={styles.hint}>
          Utilise tes Brumes pour déflouter les profils et découvrir la vraie personnalité
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wallet: {
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  badge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c5ce7',
  },
  brumeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  brumeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  brumeText: {
    flex: 1,
  },
  brumeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6c5ce7',
  },
  brumeLabel: {
    fontSize: 12,
    color: '#8b8e9f',
    fontWeight: '500',
    marginTop: 2,
  },
  rechargeBtn: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  rechargeBtnPremium: {
    backgroundColor: 'rgba(108, 92, 231, 0.9)',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  rechargeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    color: '#8b8e9f',
    lineHeight: 16,
    textAlign: 'center',
  },
});
