import { getSupabase } from '~/integrations/supabase';
import { SERVER_URL } from '~/utils/env';

export async function signWithGithub() {
  await getSupabase().auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${SERVER_URL}/oauth/callback`,
    },
  });
}
