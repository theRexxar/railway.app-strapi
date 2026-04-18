export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  sessions: {
    // 1 hour in seconds
    idleSessionLifespan: 3600, 
    // 30 days in seconds
    maxSessionLifespan: 2592000, 
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  url: env('ADMIN_URL', 'https://cms.jaripmi.info/admin'),
});
