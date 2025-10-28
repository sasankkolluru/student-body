module.exports = {
  apps: [
    {
      name: 'student-body-backend',
      script: 'dist/index.js',
      cwd: './server',
      instances: 'max',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'rasa-chatbot',
      script: 'rasa',
      args: 'run -m models --enable-api --cors "*" --debug',
      cwd: './rasa-chatbot',
      interpreter: 'python',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        RASA_ACTIONS_PORT: 5055,
        RASA_ACTIONS_URL: 'http://localhost:5055/webhook',
        RASA_SERVER_PORT: 5005
      }
    },
    {
      name: 'rasa-actions',
      script: 'rasa',
      args: 'run actions --cors "*" --debug',
      cwd: './rasa-chatbot',
      interpreter: 'python',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        RASA_ACTIONS_PORT: 5055
      }
    }
  ]
};
