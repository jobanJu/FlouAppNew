module.exports = {
  apps: [
    {
      name: 'flouapp',
      script: './node_modules/.bin/expo',
      args: 'start',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.expo', 'dist'],
      env: {
        NODE_ENV: 'production',
        EXPO_PUBLIC_SUPABASE_URL: 'https://lyqtupcjevgxpovzevcz.supabase.co',
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cXR1cGNqZXZneHBvdnpldmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTUwNzAsImV4cCI6MjA4MTc5MTA3MH0.pN4bjcbxHSLIkOFwyZuGwEiZ5vYVNC-SS9RqTTle3bk',
        LIVEKIT_URL: 'wss://flouapp-mejnaydh.livekit.cloud',
        LIVEKIT_API_KEY: 'APIJZ8kdXvHxS4j',
        LIVEKIT_API_SECRET: 'KyLjPsROTeXbd294yoLNhI2dXCUwOZTLcGLg73RiqCd'
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      listen_timeout: 10000,
      kill_timeout: 5000
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'https://github.com/jobanJu/FlouAppNew.git',
      path: '/var/www/flouapp',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production"'
    }
  }
};
