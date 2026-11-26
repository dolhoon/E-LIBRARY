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
    window.pendingServiceNotice = true;
    return;
  }

  const supabase = window.supabase;
  if (!supabase || typeof supabase.createClient !== 'function') {
    window.supabaseReady = false;
    window.supabaseClient = null;
    window.pendingServiceNotice = true;
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
