export type Bindings = {
  DB: D1Database;
  TURNSTILE_SECRET: string;
  IP_SALT: string;
  ALLOWED_ORIGINS: string;
  ACCESS_AUD: string;
  ACCESS_TEAM_DOMAIN: string;
  UMAMI_SCRIPT_URL?: string;
  UMAMI_WEBSITE_ID?: string;
  LICENSE_PRIVATE_KEY?: string;
  APP_URL?: string;
  MAYAR_API_KEY?: string;
  MAYAR_BASE_URL?: string;
  MAYAR_WEBHOOK_TOKEN?: string;
};

export type AppEnv = { Bindings: Bindings };
