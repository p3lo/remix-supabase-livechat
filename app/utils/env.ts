import { isBrowser } from './is-browser';

declare global {
  interface Window {
    env: {
      SUPABASE_URL: string;
      SUPABASE_ANON_PUBLIC: string;
      SERVER_URL: string;
    };
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SUPABASE_URL: string;
      SUPABASE_SERVICE_ROLE: string;
      SERVER_URL: string;
      SUPABASE_ANON_PUBLIC: string;
      SESSION_SECRET: string;
      // STRIPE
      STRIPE_PUBLIC_API_KEY: string;
      STRIPE_SECRET_API_KEY: string;

      // STRIPE PLANS
      PLAN_1_PRICE_ID: string;
      PLAN_2_PRICE_ID: string;
      PLAN_3_PRICE_ID: string;

      // STRIPE WEBHOOK
      DEV_STRIPE_WEBHOOK_ENDPOINT_SECRET: string;
      PROD_STRIPE_WEBHOOK_ENDPOINT_SECRET: string;
    }
  }
}

type EnvOptions = {
  isSecret?: boolean;
  isRequired?: boolean;
};
function getEnv(name: string, { isRequired, isSecret }: EnvOptions = { isSecret: true, isRequired: true }) {
  if (isBrowser && isSecret) return '';

  const source = (isBrowser ? window.env : process.env) ?? {};

  const value = source[name as keyof typeof source];

  if (!value && isRequired) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

/**
 * Server env
 */
export const SERVER_URL = getEnv('SERVER_URL', { isSecret: false });
export const SUPABASE_SERVICE_ROLE = getEnv('SUPABASE_SERVICE_ROLE');
export const SESSION_SECRET = getEnv('SESSION_SECRET');
export const STRIPE_PUBLIC_API_KEY = getEnv('STRIPE_PUBLIC_API_KEY');
export const STRIPE_SECRET_API_KEY = getEnv('STRIPE_SECRET_API_KEY');
export const PLAN_1_PRICE_ID = getEnv('PLAN_1_PRICE_ID');
export const PLAN_2_PRICE_ID = getEnv('PLAN_2_PRICE_ID');
export const PLAN_3_PRICE_ID = getEnv('PLAN_3_PRICE_ID');
export const DEV_STRIPE_WEBHOOK_ENDPOINT_SECRET = getEnv('DEV_STRIPE_WEBHOOK_ENDPOINT_SECRET');
export const PROD_STRIPE_WEBHOOK_ENDPOINT_SECRET = getEnv('PROD_STRIPE_WEBHOOK_ENDPOINT_SECRET');

/**
 * Shared envs
 */
export const NODE_ENV = getEnv('NODE_ENV', {
  isSecret: false,
  isRequired: false,
});
export const SUPABASE_URL = getEnv('SUPABASE_URL', { isSecret: false });
export const SUPABASE_ANON_PUBLIC = getEnv('SUPABASE_ANON_PUBLIC', {
  isSecret: false,
});

export function getBrowserEnv() {
  return {
    SUPABASE_URL,
    SUPABASE_ANON_PUBLIC,
    SERVER_URL,
  };
}
