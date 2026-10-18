// Signed-in member's company information. The email always comes from the verified session, not the request body.
import { db, handle, requireUser, getProfile, profileComplete, send, text } from './_lib/server.js';

export default handle(['GET', 'PUT'], async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const profile = await getProfile(user.id);
    return send(res, 200, { email: user.email, profile, complete: profileComplete(profile) });
  }

  const body = req.body || {};
  const row = {
    user_id: user.id,
    email: user.email,
    company: text(body.company, 120),
    contact_name: text(body.contactName, 60),
    job_title: text(body.jobTitle, 60) || null,
    purpose: text(body.purpose, 500) || null,
    updated_at: new Date().toISOString()
  };
  const missing = [];
  if (!row.company) missing.push('company');
  if (!row.contact_name) missing.push('contactName');
  if (missing.length) return send(res, 400, { error: 'missing_fields', fields: missing });

  const { error } = await db().from('member_profiles').upsert(row, { onConflict: 'user_id' });
  if (error) throw error;
  const profile = await getProfile(user.id);
  send(res, 200, { email: user.email, profile, complete: profileComplete(profile) });
});
