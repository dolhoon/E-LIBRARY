document.addEventListener('DOMContentLoaded', async function () {
  const pageRoot = document.body.dataset.page;
  if (pageRoot !== 'member') return;

  if (!window.supabaseClient) {
    window.showSetupNotice();
    return;
  }

  const { data: sessionData, error: sessionError } = await window.supabaseClient.auth.getSession();
  if (sessionError || !sessionData.session) {
    window.location.href = 'login.html';
    return;
  }

  const user = sessionData.session.user;
  const { data: profileData, error: profileError } = await window.supabaseClient.from('profiles').select('*').eq('user_id', user.id).single();
  if (profileError || !profileData) {
    window.showToast('Profile information is unavailable.', 'error');
    return;
  }

  const profileName = document.querySelector('#member-name');
  if (profileName) profileName.textContent = profileData.name || user.email;

  const roleEl = document.querySelector('#member-role');
  if (roleEl) roleEl.textContent = (profileData.user_type || 'student').replace(/^./, (c) => c.toUpperCase());

  const institutionEl = document.querySelector('#member-institution');
  if (institutionEl) institutionEl.textContent = profileData.institutional_id || '—';

  const emailEl = document.querySelector('#member-email');
  if (emailEl) emailEl.textContent = user.email || '—';

  const { data: borrowings, error: borrowError } = await window.supabaseClient
    .from('borrowings')
    .select('*, books(title, author, cover_url)')
    .eq('user_id', user.id)
    .order('borrow_date', { ascending: false });

  const tableBody = document.querySelector('#member-borrowing-body');
  if (tableBody) {
    if (borrowError || !borrowings || borrowings.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="empty-cell">No borrowing history yet.</td></tr>';
      return;
    }

    tableBody.innerHTML = borrowings.map((item) => {
      const status = item.status || 'pending';
      const badgeClass = status === 'returned' ? 'badge-success' : status === 'approved' || status === 'borrowed' ? 'badge-info' : status === 'rejected' ? 'badge-muted' : 'badge-warning';
      const book = item.books || {};
      return `
        <tr>
          <td>
            <div class="history-book">
              <img src="${book.cover_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80'}" alt="${book.title || 'Book cover'}" onerror="this.src='https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80';">
              <div>
                <strong>${book.title || 'Untitled book'}</strong>
                <small>${book.author || 'Unknown author'}</small>
              </div>
            </div>
          </td>
          <td>${item.borrow_date ? new Date(item.borrow_date).toLocaleDateString() : '—'}</td>
          <td>${item.due_date ? new Date(item.due_date).toLocaleDateString() : '—'}</td>
          <td><span class="badge ${badgeClass}">${status}</span></td>
        </tr>
      `;
    }).join('');
  }
});
