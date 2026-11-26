(function () {
  const DEMO_USERS_KEY = 'elibrary_demo_users';
  const DEMO_SESSION_KEY = 'elibrary_demo_session';
  const BORROW_KEY = 'elibrary_demo_borrowings';

  const sampleUser = {
    name: 'Alya Nadhira',
    email: 'student@fst.ac.id',
    password: 'library123',
    user_type: 'student',
    institutional_id: '202301001'
  };

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (_) { return fallback; }
  }
  function users() {
    let list = read(DEMO_USERS_KEY, []);
    if (!list.some(u => u.email.toLowerCase() === sampleUser.email)) {
      list.unshift(sampleUser);
      localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(list));
    }
    return list;
  }
  function currentUser() {
    return read(DEMO_SESSION_KEY, null);
  }
  function setSession(user) {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({
      name: user.name, email: user.email, user_type: user.user_type,
      institutional_id: user.institutional_id || ''
    }));
  }
  function seedBorrowings() {
    if (localStorage.getItem(BORROW_KEY)) return;
    const today = new Date();
    const past = new Date(today); past.setDate(today.getDate() - 3);
    const due = new Date(today); due.setDate(today.getDate() + 11);
    const returned = new Date(today); returned.setDate(today.getDate() - 18);
    const returnDue = new Date(today); returnDue.setDate(today.getDate() - 4);
    localStorage.setItem(BORROW_KEY, JSON.stringify([
      { id: 'demo-borrow-1', email: sampleUser.email, book_id: 'demo-001', borrow_date: past.toISOString(), due_date: due.toISOString(), return_date: null, status: 'borrowed' },
      { id: 'demo-borrow-2', email: sampleUser.email, book_id: 'demo-010', borrow_date: returned.toISOString(), due_date: returnDue.toISOString(), return_date: returnDue.toISOString(), status: 'returned' }
    ]));
  }
  window.demoAuth = {
    currentUser, users, setSession,
    getBorrowings: () => read(BORROW_KEY, []),
    saveBorrowings: value => localStorage.setItem(BORROW_KEY, JSON.stringify(value)),
    seedBorrowings,
    getUser: email => users().find(u => u.email.toLowerCase() === String(email).toLowerCase())
  };

  document.addEventListener('DOMContentLoaded', async function () {
    if (window.pendingServiceNotice) {
      window.pendingServiceNotice = false;
      window.showSetupNotice();
    }

    const demo = window.DATA_MODE === 'demo';
    let user = null;
    let authReady = false;
    let authEventReceived = false;
    let logoutInProgress = false;

    function userType(authUser) {
      return authUser?.user_type || authUser?.user_metadata?.user_type || authUser?.app_metadata?.user_type;
    }

    function syncAuthState(nextUser) {
      user = nextUser;
      const signedIn = !!user;
      document.querySelectorAll('[data-auth-state]').forEach(node => node.hidden = !signedIn);
      document.querySelectorAll('[data-anon-state]').forEach(node => node.hidden = signedIn);
      document.querySelectorAll('[data-admin-state]').forEach(node => {
        node.hidden = !signedIn || userType(user) !== 'admin';
      });
      document.querySelectorAll('[data-user-name]').forEach(node => {
        node.textContent = signedIn ? (user.name || user.user_metadata?.full_name || user.email || 'Member') : '';
        node.hidden = !signedIn;
      });

      if (!authReady) return;
      const page = document.body.dataset.page;
      if (signedIn && (page === 'login' || page === 'register')) {
        window.location.replace(userType(user) === 'admin' ? 'admin.html' : 'member.html');
      } else if (page === 'member' && !signedIn && !logoutInProgress) {
        window.location.replace('login.html');
      } else if (page === 'admin' && !signedIn) {
        window.location.replace('login.html');
      }
    }

    function finishAuthInitialization() {
      if (authReady) return;
      authReady = true;
      syncAuthState(user);
    }

    if (demo) {
      users();
      seedBorrowings();
      syncAuthState(currentUser());
      finishAuthInitialization();
      window.addEventListener('storage', function (event) {
        if (event.key === DEMO_SESSION_KEY) syncAuthState(currentUser());
      });
    } else if (window.supabaseClient) {
      window.supabaseClient.auth.onAuthStateChange(function (_event, session) {
        authEventReceived = true;
        syncAuthState(session?.user || null);
        finishAuthInitialization();
      });

      const { data, error } = await window.supabaseClient.auth.getSession();
      if (error) {
        if (!authEventReceived) {
          window.showToast(error.message || 'Unable to verify your session.', 'error');
          syncAuthState(null);
        }
      } else if (!authEventReceived) {
        syncAuthState(data.session?.user || null);
      }
      finishAuthInitialization();
    } else {
      syncAuthState(null);
      finishAuthInitialization();
    }

    const loginForm = document.querySelector('#login-form');
    if (loginForm) loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const email = document.querySelector('#login-email').value.trim();
      const password = document.querySelector('#login-password').value;
      if (demo) {
        const found = window.demoAuth.getUser(email);
        if (!found || found.password !== password) {
          window.showToast('Email or password is incorrect.', 'error'); return;
        }
        window.demoAuth.setSession(found);
        window.location.href = 'member.html'; return;
      }
      if (!window.supabaseClient) return window.showSetupNotice();
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (error) return window.showToast(error.message || 'Login failed.', 'error');
      const { data: profile } = await window.supabaseClient.from('profiles').select('user_type').eq('user_id', data.user.id).single();
      window.location.href = profile?.user_type === 'admin' ? 'admin.html' : 'member.html';
    });

    const registerForm = document.querySelector('#register-form');
    if (registerForm) registerForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const name = document.querySelector('#register-name').value.trim();
      const email = document.querySelector('#register-email').value.trim();
      const password = document.querySelector('#register-password').value;
      const userType = document.querySelector('#register-user-type').value;
      const institutionalId = document.querySelector('#register-institutional-id').value.trim();
      if (!name || !email || password.length < 6) {
        window.showToast('Complete all required fields. Password must be at least 6 characters.', 'error'); return;
      }
      if (demo) {
        const list = users();
        if (list.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          window.showToast('This email is already registered.', 'error'); return;
        }
        list.push({ name, email, password, user_type: userType, institutional_id: institutionalId });
        localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(list));
        window.showToast('Account created. You can log in now.', 'success');
        setTimeout(() => window.location.href = 'login.html', 900); return;
      }
      if (!window.supabaseClient) return window.showSetupNotice();
      const { data, error } = await window.supabaseClient.auth.signUp({
        email, password, options: { data: { full_name: name, user_type: userType, institutional_id: institutionalId } }
      });
      if (error) return window.showToast(error.message || 'Registration failed.', 'error');
      window.showToast(data.user && !data.session ? 'Check your email to confirm your account.' : 'Registration successful.', 'success');
      setTimeout(() => window.location.href = 'login.html', 1100);
    });

    document.querySelectorAll('[data-logout]').forEach(button => button.addEventListener('click', async function () {
      logoutInProgress = true;
      if (demo) {
        localStorage.removeItem(DEMO_SESSION_KEY);
      } else if (window.supabaseClient) {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) {
          logoutInProgress = false;
          window.showToast(error.message || 'Logout failed.', 'error');
          return;
        }
      }
      syncAuthState(null);
      window.location.href = 'index.html';
    }));

  });
})();

window.showToast = function (message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type === 'error' ? 'toast-error' : 'toast-success');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.classList.add('toast-hide'); setTimeout(() => toast.remove(), 450); }, 2800);
};
