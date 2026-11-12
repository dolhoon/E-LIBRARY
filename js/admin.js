document.addEventListener('DOMContentLoaded', async function () {
  const pageRoot = document.body.dataset.page;
  if (pageRoot !== 'admin') return;

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
  const { data: adminData, error: adminError } = await window.supabaseClient.from('admins').select('*').eq('admin_id', user.id).single();
  if (adminError || !adminData) {
    document.querySelector('#admin-content').innerHTML = '<div class="empty-state"><h3>Admin access required</h3><p>This area is restricted to trusted library administrators.</p></div>';
    return;
  }

  const booksContainer = document.querySelector('#admin-books-body');
  const borrowTable = document.querySelector('#admin-borrowing-body');
  const stats = document.querySelector('#admin-stats');

  const { data: books, error: booksError } = await window.supabaseClient.from('books').select('*').order('title', { ascending: true });
  const { data: users, error: usersError } = await window.supabaseClient.from('profiles').select('*').order('name', { ascending: true });
  const { data: borrowings, error: borrowingsError } = await window.supabaseClient.from('borrowings').select('*, books(title, author), profiles(name)').order('borrow_date', { ascending: false });

  if (!booksError && books) {
    const totalBooks = books.length;
    const totalUsers = users && !usersError ? users.length : 0;
    const activeBorrowings = borrowings && !borrowingsError ? borrowings.filter((b) => ['pending', 'approved', 'borrowed'].includes(b.status)).length : 0;
    const returnedBooks = borrowings && !borrowingsError ? borrowings.filter((b) => b.status === 'returned').length : 0;

    if (stats) {
      stats.innerHTML = `
        <div class="stat-card"><span>Total books</span><strong>${totalBooks}</strong></div>
        <div class="stat-card"><span>Registered users</span><strong>${totalUsers}</strong></div>
        <div class="stat-card"><span>Active borrowings</span><strong>${activeBorrowings}</strong></div>
        <div class="stat-card"><span>Returned books</span><strong>${returnedBooks}</strong></div>
      `;
    }
  }

  if (booksContainer && books && !booksError) {
    booksContainer.innerHTML = books.map((book) => `
      <tr>
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.category || 'General'}</td>
        <td>${book.stock}</td>
        <td><span class="badge ${book.availability_status === 'available' ? 'badge-success' : book.availability_status === 'borrowed' ? 'badge-warning' : 'badge-muted'}">${book.availability_status || 'available'}</span></td>
        <td>
          <div class="action-cell">
            <button class="btn btn-secondary mini-btn" data-update-book="${book.book_id}">Update</button>
            <button class="btn btn-danger mini-btn" data-delete-book="${book.book_id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    booksContainer.closest('table').addEventListener('click', async function (event) {
      const updateButton = event.target.closest('[data-update-book]');
      const deleteButton = event.target.closest('[data-delete-book]');
      if (updateButton) {
        const id = updateButton.dataset.updateBook;
        const book = books.find((entry) => entry.book_id === id);
        if (!book) return;
        const stock = Number(prompt('Update stock quantity:', book.stock) || book.stock);
        const status = prompt('Update status (available/borrowed/unavailable):', book.availability_status || 'available') || book.availability_status;
        const { error } = await window.supabaseClient.from('books').update({ stock, availability_status: status }).eq('book_id', id);
        if (error) {
          window.showToast(error.message, 'error');
        } else {
          window.showToast('Book updated.', 'success');
          setTimeout(() => location.reload(), 1000);
        }
      }

      if (deleteButton) {
        const id = deleteButton.dataset.deleteBook;
        const confirmed = confirm('Delete this book record?');
        if (!confirmed) return;
        const { error } = await window.supabaseClient.from('books').delete().eq('book_id', id);
        if (error) {
          window.showToast(error.message, 'error');
        } else {
          window.showToast('Book deleted.', 'success');
          setTimeout(() => location.reload(), 1000);
        }
      }
    });
  }

  if (borrowTable && borrowings && !borrowingsError) {
    borrowTable.innerHTML = borrowings.map((item) => `
      <tr>
        <td>${item.profiles?.name || 'Unknown user'}</td>
        <td>${item.books?.title || 'Unknown title'}</td>
        <td>${item.borrow_date ? new Date(item.borrow_date).toLocaleDateString() : '—'}</td>
        <td><span class="badge ${item.status === 'returned' ? 'badge-success' : item.status === 'rejected' ? 'badge-muted' : item.status === 'approved' || item.status === 'borrowed' ? 'badge-info' : 'badge-warning'}">${item.status}</span></td>
        <td class="action-cell">
          ${item.status === 'pending' ? `<button class="btn btn-primary mini-btn" data-approve="${item.borrowing_id}">Approve</button><button class="btn btn-secondary mini-btn" data-reject="${item.borrowing_id}">Reject</button>` : item.status === 'approved' || item.status === 'borrowed' ? `<button class="btn btn-secondary mini-btn" data-return="${item.borrowing_id}">Return</button>` : '<span class="muted-text">No action</span>'}
        </td>
      </tr>
    `).join('');

    borrowTable.closest('table').addEventListener('click', async function (event) {
      const approveButton = event.target.closest('[data-approve]');
      const rejectButton = event.target.closest('[data-reject]');
      const returnButton = event.target.closest('[data-return]');

      if (approveButton) {
        const borrowingId = approveButton.dataset.approve;
        const { data, error } = await window.supabaseClient.rpc('approve_borrowing', {
          p_borrowing_id: borrowingId,
          p_admin_id: user.id
        });
        if (error) {
          window.showToast(error.message, 'error');
        } else {
          window.showToast('Borrowing approved.', 'success');
          setTimeout(() => location.reload(), 1000);
        }
      }

      if (rejectButton) {
        const borrowingId = rejectButton.dataset.reject;
        const { error } = await window.supabaseClient.from('borrowings').update({ status: 'rejected', admin_id: user.id }).eq('borrowing_id', borrowingId);
        if (error) {
          window.showToast(error.message, 'error');
        } else {
          window.showToast('Borrowing rejected.', 'success');
          setTimeout(() => location.reload(), 1000);
        }
      }

      if (returnButton) {
        const borrowingId = returnButton.dataset.return;
        const { data, error } = await window.supabaseClient.rpc('process_return', {
          p_borrowing_id: borrowingId,
          p_admin_id: user.id
        });
        if (error) {
          window.showToast(error.message, 'error');
        } else {
          window.showToast('Book marked as returned.', 'success');
          setTimeout(() => location.reload(), 1000);
        }
      }
    });
  }

  const addBookForm = document.querySelector('#add-book-form');
  if (addBookForm) {
    addBookForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const payload = {
        title: document.querySelector('#book-title').value.trim(),
        author: document.querySelector('#book-author').value.trim(),
        category: document.querySelector('#book-category').value.trim(),
        description: document.querySelector('#book-description').value.trim(),
        cover_url: document.querySelector('#book-cover').value.trim() || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
        stock: Number(document.querySelector('#book-stock').value || 0),
        availability_status: document.querySelector('#book-status').value || 'available'
      };

      const { error } = await window.supabaseClient.from('books').insert([payload]);
      if (error) {
        window.showToast(error.message, 'error');
      } else {
        window.showToast('Book added.', 'success');
        addBookForm.reset();
        setTimeout(() => location.reload(), 1000);
      }
    });
  }
});
