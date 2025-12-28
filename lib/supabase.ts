import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://lyqtupcjevgxpovzevcz.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXR1cGNqZXZneHBvdnpldmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTUwNzAsImV4cCI6MjA4MTc5MTA3MH0.pN4bjcbxHSLIkOFwyZuGwEiZ5vYVNC-SS9RqTTle3bk';

const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL || extra?.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

if (!url || !anonKey) {
  console.warn('Supabase: EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY manquant.');
}

if (!url) {
  throw new Error('Supabase: EXPO_PUBLIC_SUPABASE_URL manquant.');
}

if (!anonKey) {
  throw new Error('Supabase: EXPO_PUBLIC_SUPABASE_ANON_KEY manquant.');
}

export const supabase = createClient(url, anonKey);
