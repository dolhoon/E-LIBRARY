// Update these values in a real Supabase project.
window.SUPABASE_CONFIG = {
  url: 'SUPABASE_URL',
  anonKey: 'SUPABASE_ANON_KEY'
};

window.showSetupNotice = function (message) {
  const setupNote = document.querySelector('[data-config-message]');
  if (setupNote) {
    setupNote.hidden = false;
    setupNote.textContent = message || 'Add your Supabase project URL and anon key in js/supabase-config.js to enable database access.';
  }
};
