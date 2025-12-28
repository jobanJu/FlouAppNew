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
