document.addEventListener('DOMContentLoaded', async function () {
  if (window.DATA_MODE === 'demo') {
    const loginForm = document.querySelector('#login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        window.showToast('Demo mode is active. Supabase authentication is not available until the project is configured.', 'error');
      });
    }

    const registerForm = document.querySelector('#register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', function (event) {
        event.preventDefault();
        window.showToast('Demo mode is active. Registration requires a live Supabase project connection.', 'error');
      });
    }

    const notice = document.querySelector('[data-config-message]');
    if (notice) {
      notice.hidden = false;
      notice.textContent = 'Demo mode is active: authentication and member data are preview-only until Supabase is connected.';
    }

    return;
  }

  if (!window.supabaseClient) {
    window.showSetupNotice();
    return;
  }

  const loginForm = document.querySelector('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const email = document.querySelector('#login-email').value.trim();
      const password = document.querySelector('#login-password').value;

      if (!email || !password) {
        return window.showToast('Email and password are required.', 'error');
      }

      const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        return window.showToast(error.message || 'Login failed.', 'error');
      }

      const { data: profileData } = await window.supabaseClient.from('profiles').select('user_type').eq('user_id', data.user.id).single();
      window.location.href = profileData?.user_type === 'admin' ? 'admin.html' : 'member.html';
    });
  }

  const registerForm = document.querySelector('#register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const name = document.querySelector('#register-name').value.trim();
      const email = document.querySelector('#register-email').value.trim();
      const password = document.querySelector('#register-password').value;
      const userType = document.querySelector('#register-user-type').value;
      const institutionalId = document.querySelector('#register-institutional-id').value.trim();

      if (!name || !email || !password) {
        return window.showToast('Full name, email, and password are required.', 'error');
      }

      const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            user_type: userType,
            institutional_id: institutionalId
          }
        }
      });

      if (error) {
        return window.showToast(error.message || 'Registration failed.', 'error');
      }

      if (data.user && !data.session) {
        window.showToast('Registration successful. Check your email to confirm the account.', 'success');
        setTimeout(() => window.location.href = 'login.html', 1200);
        return;
      }

      window.showToast('Registration successful. You can now log in.', 'success');
      setTimeout(() => window.location.href = 'login.html', 1000);
    });
  }

  const session = await window.supabaseClient.auth.getSession();
  const user = session.data.session?.user || null;

  const authNav = document.querySelectorAll('[data-auth-state]');
  authNav.forEach((node) => {
    if (user) {
      node.hidden = false;
    } else {
      node.hidden = true;
    }
  });

  const signedOutNav = document.querySelectorAll('[data-anon-state]');
  signedOutNav.forEach((node) => {
    if (!user) {
      node.hidden = false;
    } else {
      node.hidden = true;
    }
  });

  if (document.body.dataset.page === 'login' && user) {
    const { data: profileData } = await window.supabaseClient.from('profiles').select('user_type').eq('user_id', user.id).single();
    window.location.href = profileData?.user_type === 'admin' ? 'admin.html' : 'member.html';
  }
});

window.showToast = function (message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast ' + (type === 'error' ? 'toast-error' : 'toast-success');
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(function () {
    toast.classList.add('toast-hide');
    setTimeout(function () { toast.remove(); }, 450);
  }, 2800);
};
