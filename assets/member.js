// Browser side of member login. Holds only the public (publishable) key from /api/config;
// every permission check happens again on the server.
(() => {
  'use strict';
  let clientPromise;

  const Member = {
    // Returns a Supabase client, or null when the auth service is not connected yet.
    client() {
      clientPromise ??= (async () => {
        if (!window.supabase?.createClient) return null;
        const response = await fetch('/api/config', { cache: 'no-store' });
        if (!response.ok) return null;
        const config = await response.json();
        if (!config.configured) return null;
        return window.supabase.createClient(config.supabaseUrl, config.publishableKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
      })().catch(() => null);
      return clientPromise;
    },

    async session() {
      const client = await Member.client();
      if (!client) return null;
      const { data } = await client.auth.getSession();
      return data.session || null;
    },

    async api(path, { method = 'GET', body } = {}) {
      const session = await Member.session();
      const headers = {};
      if (session) headers.Authorization = `Bearer ${session.access_token}`;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      let response;
      try {
        response = await fetch(path, {
          method,
          headers,
          cache: 'no-store',
          body: body === undefined ? undefined : JSON.stringify(body)
        });
      } catch {
        return { ok: false, status: 0, data: { error: 'network_error' } };
      }
      let data = {};
      try { data = await response.json(); } catch { /* empty body */ }
      return { ok: response.ok, status: response.status, data };
    },

    // Only same-site paths are allowed as a return destination.
    safeNext(value, fallback = '/pcb-viewer/') {
      const next = String(value || '');
      if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
      return next;
    },

    accountUrl(next, extra = {}) {
      const params = new URLSearchParams({ next, ...extra });
      return `/account/?${params}`;
    }
  };

  window.Member = Member;
})();
