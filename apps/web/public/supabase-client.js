// Loads Supabase config from the backend, inits the browser client, and
// exposes it as window._supabase. Dispatches 'supabase:ready' when done.
(function () {
  fetch('/api/config')
    .then(function (r) { return r.json(); })
    .then(function (cfg) {
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
      script.onload = function () {
        // MVP "no memory": do not persist sessions across refreshes.
        var client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        });
        window._supabase = client;

        client.auth.getSession().then(function (result) {
          var session = (result.data && result.data.session) || null;
          window._supabaseSession = session;
          document.dispatchEvent(new CustomEvent('supabase:ready', { detail: { session: session } }));
        });

        client.auth.onAuthStateChange(function (_event, session) {
          window._supabaseSession = session;
        });
      };
      document.head.appendChild(script);
    })
    .catch(function (err) {
      console.warn('[supabase-client] Failed to load config:', err.message);
    });
})();
