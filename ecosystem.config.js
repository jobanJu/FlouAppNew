module.exports = {
  apps: [
    {
      name: "flouapp-backend",
      script: "npm",
      args: "start",
      cwd: "/home/jj755403/FlouAppNew/backend",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      env: {
        NODE_ENV: "production",
        PORT: "3001"
      }
    },
    {
      name: "flouapp-frontend",
      script: "npm",
      args: "start",
      cwd: "/home/jj755403/FlouAppNew",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
