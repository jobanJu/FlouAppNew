# Stripe (Checkout) Integration Guide

This project uses Stripe Checkout for payments (recommended for Expo-managed apps).

Quick steps
- Deploy a small backend endpoint that creates Checkout Sessions (example in `scripts/create-checkout-session.example.js`).
- Set your secret key as `STRIPE_SECRET_KEY` in the backend environment.
- Use the `components/stripe-button.tsx` in the app and pass the `priceId` and `apiBaseUrl` (your backend base URL).

Example usage in a screen:

```tsx
import StripeButton from '@/components/stripe-button';

// render
<StripeButton priceId="price_12345" apiBaseUrl="https://api.example.com" />
```

Notes
- Use Stripe test price IDs while developing.
- Checkout sessions redirect to the browser. For a native in-app flow, consider `@stripe/stripe-react-native` and an EAS build.
- Make sure your backend's `success_url` and `cancel_url` are reachable from the device/emulator.
