import { Linking } from 'react-native';

/**
 * Create a Checkout Session by calling your backend.
 * @param apiBaseUrl Full URL of your backend (no trailing slash)
 * @param priceId Price ID (Stripe) or product identifier your backend understands
 */
export async function createCheckoutSession(apiBaseUrl: string, priceId: string, quantity = 1) {
  const res = await fetch(`${apiBaseUrl}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ priceId, quantity }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create checkout session: ${text}`);
  }

  const json = await res.json();
  return json.url as string;
}

export async function openCheckout(url: string) {
  // Use Linking to open the Checkout URL in the system browser
  await Linking.openURL(url);
}
