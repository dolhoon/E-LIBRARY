document.addEventListener('DOMContentLoaded', async function () {
  const bookHolder = document.querySelector('#book-detail');
  if (!bookHolder) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    bookHolder.innerHTML = '<div class="empty-state"><h3>Book not found</h3><p>The selected book could not be located.</p></div>';
    return;
  }

  if (window.DATA_MODE === 'demo') {
    window.showDemoNotice('Demo mode is active: this book preview uses sample catalog data. Borrowing and authentication require Supabase when the project is connected.');
  }

  const { data, error } = await window.libraryData.getBookById(id);

  if (error || !data) {
    bookHolder.innerHTML = '<div class="empty-state"><h3>Book not found</h3><p>Try going back to the catalog.</p></div>';
    return;
  }

  const book = data;
  const session = window.supabaseClient ? await window.supabaseClient.auth.getSession() : null;
  const user = session?.data?.session?.user || null;

  const statusText = (book.availability_status || 'available').replace(/_/g, ' ');
  const isBorrowDisabled = Number(book.stock) <= 0 || statusText.toLowerCase() === 'unavailable';

  const borrowMarkup = window.DATA_MODE === 'demo'
    ? '<div class="detail-message"><p><strong>Demo mode:</strong> Borrowing is a preview only. Real requests are activated when Supabase is connected.</p><button id="demo-borrow-button" class="btn btn-primary">Preview borrow request</button></div>'
    : !user
    ? '<div class="detail-message"><p>Please log in to submit a borrowing request.</p><a href="login.html" class="btn btn-primary">Login to borrow</a></div>'
    : isBorrowDisabled
      ? '<button class="btn btn-muted" disabled>Unavailable</button>'
      : '<button id="borrow-button" class="btn btn-primary">Borrow this book</button>';

  bookHolder.innerHTML = `
    <div class="detail-grid">
      <div class="detail-image-wrap">
        <img src="${book.cover_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80'}" alt="${book.title}" onerror="this.src='https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80';">
      </div>
      <div class="detail-copy">
        <p class="eyebrow">${book.category || 'General'}</p>
        <h1>${book.title}</h1>
        <p class="detail-author">by ${book.author}</p>
        <div class="detail-actions">
          <span class="badge ${statusText === 'available' ? 'badge-success' : statusText === 'borrowed' ? 'badge-warning' : 'badge-muted'}">${statusText}</span>
          <span class="stock-label">${Number(book.stock) > 0 ? 'Copies available: ' + book.stock : 'Currently unavailable'}</span>
        </div>
        <p class="detail-description">${book.description || 'No description is available yet for this title.'}</p>
        <div class="info-card">
          <div><span>Stock</span><strong>${book.stock}</strong></div>
          <div><span>Status</span><strong>${statusText}</strong></div>
          <div><span>Borrow period</span><strong>14 days</strong></div>
        </div>
        ${borrowMarkup}
      </div>
    </div>
  `;

  const borrowButton = document.querySelector('#demo-borrow-button');
  if (borrowButton) {
    borrowButton.addEventListener('click', function () {
      window.showToast('Demo mode is active. Borrowing requests are preview-only until a live Supabase connection is configured.', 'error');
    });
  }

  const liveBorrowButton = document.querySelector('#borrow-button');
  if (liveBorrowButton) {
    liveBorrowButton.addEventListener('click', async function () {
      if (!user) return;
      const { data, error } = await window.supabaseClient.rpc('request_borrowing', {
        p_user_id: user.id,
        p_book_id: book.book_id
      });

      if (error) {
        window.showToast(error.message || 'Borrowing request failed.', 'error');
        return;
      }

      window.showToast('Borrowing request submitted successfully.', 'success');
      setTimeout(() => window.location.href = 'member.html', 1200);
    });
  }
});
