export type Bindings = {
  DB: D1Database;
  TURNSTILE_SECRET: string;
  IP_SALT: string;
  ALLOWED_ORIGINS: string;
  ACCESS_AUD: string;
  ACCESS_TEAM_DOMAIN: string;
  UMAMI_SCRIPT_URL?: string;
  UMAMI_WEBSITE_ID?: string;
};

export type AppEnv = { Bindings: Bindings };
