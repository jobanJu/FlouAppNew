/**
 * app.config.js
 * Centralized Expo config with `extra` values for BACKEND_URL and Supabase
 * - Do NOT commit secrets to source control.
 * - For production builds, set the environment variables in your CI/EAS or hosting provider.
 */

export default ({ config }) => {
  return {
    ...config,
    expo: {
      ...(config.expo || {}),
      extra: {
        BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',
        EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lyqtupcjevgxpovzevcz.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY:
          process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '<YOUR_PUBLIC_ANON_KEY>',
        LIVEKIT_URL: process.env.LIVEKIT_URL || 'wss://flouapp-mejnaydh.livekit.cloud',
      },
    },
  };
};
const appJson = require('./app.json');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lyqtupcjevgxpovzevcz.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXR1cGNqZXZneHBvdnpldmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTUwNzAsImV4cCI6MjA4MTc5MTA3MH0.pN4bjcbxHSLIkOFwyZuGwEiZ5vYVNC-SS9RqTTle3bk';

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      package: "com.flouapp.jonjonju"
    },
    extra: {
      ...appJson.expo?.extra,
      EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
      eas: {
        projectId: "abc80bb5-b17a-430a-a831-925a1ed04e21"
      }
    },
  },
};
