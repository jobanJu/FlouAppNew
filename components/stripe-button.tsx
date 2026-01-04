import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import theme from '@/constants/theme';
import { createCheckoutSession, openCheckout } from '@/lib/stripe';

type Props = {
  priceId: string;
  label?: string;
  /** Backend base URL (e.g. https://api.example.com) */
  apiBaseUrl?: string;
};

export default function StripeButton({ priceId, label = 'Payer', apiBaseUrl = 'https://your-backend.example.com' }: Props) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      const url = await createCheckoutSession(apiBaseUrl, priceId);
      await openCheckout(url);
    } catch (err) {
      console.error('Stripe checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handlePress} disabled={loading}>
      {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.7,
  },
  label: {
    color: '#FFF',
    fontWeight: '600',
  },
});
