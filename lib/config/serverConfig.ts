const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!");
}

export const serverConfig = {
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
};