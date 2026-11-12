(function () {
  if (window.DATA_MODE === 'demo') {
    window.supabaseReady = false;
    window.supabaseClient = null;
    return;
  }

  const config = window.SUPABASE_CONFIG || {};
  const url = (config.url || '').trim();
  const anonKey = (config.anonKey || '').trim();

  if (!url || url === 'SUPABASE_URL' || !anonKey || anonKey === 'SUPABASE_ANON_KEY') {
    window.supabaseReady = false;
    window.supabaseClient = null;
    window.showSetupNotice('Supabase is not configured yet. Add your project URL and anon key in js/supabase-config.js.');
    return;
  }

  const supabase = window.supabase;
  if (!supabase || typeof supabase.createClient !== 'function') {
    window.supabaseReady = false;
    window.supabaseClient = null;
    window.showSetupNotice('The Supabase JavaScript client did not load. Check the CDN script in your HTML files.');
    return;
  }

  window.supabaseClient = supabase.createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  window.supabaseReady = true;
})();
