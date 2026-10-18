// Public browser configuration. The publishable key is designed to be public;
// the secret key stays on the server.
import { isConfigured, supabaseUrl } from './_lib/server.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const url = isConfigured() ? supabaseUrl() : '';
  const configured = Boolean(url);
  res.status(200).json(configured
    ? {
        configured,
        supabaseUrl: url,
        publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY.trim()
      }
    : { configured });
}
