document.addEventListener('DOMContentLoaded', function () {
  if (window.DATA_MODE === 'demo') {
    const notice = document.querySelector('[data-config-message]');
    if (notice) {
      notice.hidden = false;
      notice.textContent = 'Demo mode is active: the catalog is using local sample data. Connect Supabase to enable live authentication and borrowing persistence.';
    }
  }

  const navToggle = document.querySelector('.nav-toggle');
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      const navMenu = document.querySelector('.nav-menu');
      if (navMenu) {
        navMenu.classList.toggle('open');
      }
    });
  }

  document.querySelectorAll('.alert').forEach(function (alertEl) {
    setTimeout(function () {
      alertEl.classList.add('fade-out');
      setTimeout(function () {
        if (alertEl.parentNode) {
          alertEl.parentNode.removeChild(alertEl);
        }
      }, 500);
    }, 3000);
  });

  const logoutButtons = document.querySelectorAll('[data-logout]');
  logoutButtons.forEach(function (button) {
    button.addEventListener('click', async function () {
      if (window.DATA_MODE === 'demo') {
        window.showToast('Demo mode is active. Sign out and authentication are handled by Supabase once the project is configured.', 'error');
        return;
      }

      if (!window.supabaseClient) {
        window.location.href = 'login.html';
        return;
      }

      const { error } = await window.supabaseClient.auth.signOut();
      if (!error) {
        window.location.href = 'login.html';
      }
    });
  });
});

window.showDemoNotice = function (message) {
  const notice = document.querySelector('[data-config-message]');
  if (!notice) return;

  notice.hidden = false;
  notice.textContent = message || 'Demo mode is active: local sample data is being shown for presentation purposes only.';
};

window.showSetupNotice = function (message) {
  const notice = document.querySelector('[data-config-message]');
  if (!notice) return;

  notice.hidden = false;
  notice.textContent = message || 'Add your Supabase project URL and anon key in js/supabase-config.js to enable database access.';
};
