document.addEventListener('DOMContentLoaded', async function () {
  const catalogGrid = document.querySelector('#catalog-grid');
  const pageRoot = document.body.dataset.page;

  if (!catalogGrid) return;

  if (window.DATA_MODE === 'demo') {
    window.showDemoNotice('Demo mode is active: local sample books are being displayed for presentation purposes only.');
  }

  const params = new URLSearchParams(window.location.search);
  const search = (params.get('search') || '').trim();
  const category = params.get('category') || '';
  const status = params.get('status') || '';
  const sort = params.get('sort') || 'title';

  const categoryFilters = document.querySelector('#category-filter');
  const statusFilter = document.querySelector('#status-filter');
  const sortFilter = document.querySelector('#sort-filter');
  const searchInput = document.querySelector('#catalog-search');

  if (categoryFilters) categoryFilters.value = category;
  if (statusFilter) statusFilter.value = status;
  if (sortFilter) sortFilter.value = sort;
  if (searchInput) searchInput.value = search;

  const { data: books, error } = await window.libraryData.getBooks({ search, category, status, sort });

  if (error) {
    catalogGrid.innerHTML = '<div class="empty-state"><h3>Catalog unavailable</h3><p>' + error.message + '</p></div>';
    return;
  }

  if (!books || books.length === 0) {
    catalogGrid.innerHTML = '<div class="empty-state"><h3>No books match your filters.</h3><p>Try another author, category, or availability status.</p></div>';
    return;
  }

  const categories = [...new Set(books.map((book) => book.category).filter(Boolean))];
  const availableOptions = document.querySelector('#category-filter');
  if (availableOptions && availableOptions.options.length <= 1) {
    categories.forEach((item) => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      availableOptions.appendChild(option);
    });
  }

  const cards = books.map((book) => {
    const statusText = (book.availability_status || 'available').replace(/_/g, ' ');
    const badgeClass = statusText === 'available' ? 'badge-success' : statusText === 'borrowed' ? 'badge-warning' : 'badge-muted';
    return `
      <article class="book-card">
        <div class="book-cover-wrap">
          <img src="${book.cover_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80'}" alt="${book.title}" onerror="this.src='https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80';">
          <span class="badge ${badgeClass}">${statusText}</span>
        </div>
        <div class="card-body">
          <h3>${book.title}</h3>
          <p class="author">${book.author}</p>
          <p class="category">${book.category || 'General'}</p>
        </div>
        <div class="card-footer">
          <a href="book.html?id=${book.book_id}" class="btn btn-secondary">View details</a>
        </div>
      </article>
    `;
  }).join('');

  catalogGrid.innerHTML = cards;

  if (pageRoot === 'home') {
    const featured = books.slice(0, 4);
    const featuredGrid = document.querySelector('#featured-books');
    if (featuredGrid) {
      featuredGrid.innerHTML = featured.map((book) => `
        <article class="book-card">
          <div class="book-cover-wrap">
            <img src="${book.cover_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80'}" alt="${book.title}" onerror="this.src='https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80';">
            <span class="badge ${book.availability_status === 'available' ? 'badge-success' : 'badge-muted'}">${book.availability_status || 'available'}</span>
          </div>
          <div class="card-body">
            <h3>${book.title}</h3>
            <p class="author">${book.author}</p>
            <p class="category">${book.category || 'General'}</p>
          </div>
          <div class="card-footer">
            <a href="book.html?id=${book.book_id}" class="btn btn-secondary">View details</a>
          </div>
        </article>
      `).join('');
    }

    const recentGrid = document.querySelector('#recent-books');
    if (recentGrid) {
      const recentItems = books.slice().reverse().slice(0, 4);
      recentGrid.innerHTML = recentItems.map((book) => `
        <article class="book-card">
          <div class="book-cover-wrap">
            <img src="${book.cover_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80'}" alt="${book.title}" onerror="this.src='https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80';">
            <span class="badge ${book.availability_status === 'available' ? 'badge-success' : 'badge-muted'}">${book.availability_status || 'available'}</span>
          </div>
          <div class="card-body">
            <h3>${book.title}</h3>
            <p class="author">${book.author}</p>
            <p class="category">${book.category || 'General'}</p>
          </div>
          <div class="card-footer">
            <a href="book.html?id=${book.book_id}" class="btn btn-secondary">View details</a>
          </div>
        </article>
      `).join('');
    }
  }

  const filterForm = document.querySelector('#catalog-filters');
  if (filterForm) {
    filterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const searchValue = searchInput ? searchInput.value.trim() : '';
      const categoryValue = categoryFilters ? categoryFilters.value : '';
      const statusValue = statusFilter ? statusFilter.value : '';
      const sortValue = sortFilter ? sortFilter.value : 'title';

      const params = new URLSearchParams();
      if (searchValue) params.set('search', searchValue);
      if (categoryValue) params.set('category', categoryValue);
      if (statusValue) params.set('status', statusValue);
      if (sortValue) params.set('sort', sortValue);

      window.location.href = 'catalog.html?' + params.toString();
    });
  }
});
