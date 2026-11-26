document.addEventListener('DOMContentLoaded', async function () {
  if (document.body.dataset.page !== 'member') return;
  if (window.DATA_MODE === 'demo') {
    const user = window.demoAuth?.currentUser();
    if (!user) { window.location.replace('login.html'); return; }
    const books = window.DEMO_BOOKS || [];
    const rows = window.demoAuth.getBorrowings().filter(item => item.email === user.email);
    const active = rows.filter(item => ['borrowed', 'approved', 'pending'].includes(item.status));
    const returned = rows.filter(item => item.status === 'returned');
    const nextDue = active.map(item => item.due_date).filter(Boolean).sort()[0];
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    set('member-name', user.name);
    set('member-role', (user.user_type || 'student').replace(/^./, c => c.toUpperCase()));
    set('member-institution', user.institutional_id || '—');
    set('member-email', user.email);
    set('member-active', active.length);
    set('member-returned', returned.length);
    set('member-next-due', nextDue ? new Date(nextDue).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—');
    const body = document.querySelector('#member-borrowing-body');
    if (!body) return;
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="4" class="empty-cell">No borrowing history yet.</td></tr>';
      return;
    }
    body.innerHTML = rows.sort((a,b) => new Date(b.borrow_date) - new Date(a.borrow_date)).map(item => {
      const book = books.find(b => String(b.book_id) === String(item.book_id)) || {};
      const overdue = item.status !== 'returned' && item.due_date && new Date(item.due_date) < new Date();
      const status = overdue ? 'overdue' : item.status;
      const badge = status === 'returned' ? 'badge-success' : status === 'overdue' ? 'badge-warning' : 'badge-info';
      return `<tr><td><div class="history-book"><img src="${book.cover_url || ''}" alt=""><div><strong>${book.title || 'Book'}</strong><small>${book.author || ''}</small></div></div></td><td>${item.borrow_date ? new Date(item.borrow_date).toLocaleDateString() : '—'}</td><td>${item.due_date ? new Date(item.due_date).toLocaleDateString() : '—'}</td><td><span class="badge ${badge}">${status}</span></td></tr>`;
    }).join('');
    return;
  }

  if (!window.supabaseClient) { window.showSetupNotice(); return; }
  const { data: sessionData } = await window.supabaseClient.auth.getSession();
  if (!sessionData.session) { window.location.href = 'login.html'; return; }
  const user = sessionData.session.user;
  const { data: profile } = await window.supabaseClient.from('profiles').select('*').eq('user_id', user.id).single();
  if (!profile) { window.showToast('Profile information is unavailable.', 'error'); return; }
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  set('member-name', profile.name || user.email);
  set('member-role', (profile.user_type || 'student').replace(/^./, c => c.toUpperCase()));
  set('member-institution', profile.institutional_id || '—');
  set('member-email', user.email || '—');
  const { data: borrowings } = await window.supabaseClient.from('borrowings').select('*, books(title, author, cover_url)').eq('user_id', user.id).order('borrow_date', { ascending: false });
  const body = document.querySelector('#member-borrowing-body');
  if (!body) return;
  body.innerHTML = !borrowings?.length ? '<tr><td colspan="4" class="empty-cell">No borrowing history yet.</td></tr>' : borrowings.map(item => {
    const status = item.status || 'pending', book = item.books || {};
    const cls = status === 'returned' ? 'badge-success' : ['approved','borrowed'].includes(status) ? 'badge-info' : 'badge-warning';
    return `<tr><td><div class="history-book"><img src="${book.cover_url || ''}" alt=""><div><strong>${book.title || 'Book'}</strong><small>${book.author || ''}</small></div></div></td><td>${item.borrow_date ? new Date(item.borrow_date).toLocaleDateString() : '—'}</td><td>${item.due_date ? new Date(item.due_date).toLocaleDateString() : '—'}</td><td><span class="badge ${cls}">${status}</span></td></tr>`;
  }).join('');
});
