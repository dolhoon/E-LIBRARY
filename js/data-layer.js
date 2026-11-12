(function () {
  const dataMode = (window.DATA_MODE || 'demo').toLowerCase();
  window.DATA_MODE = dataMode;

  const normalizeBook = function (book) {
    return {
      ...book,
      book_id: String(book.book_id),
      stock: Number(book.stock) || 0,
      availability_status: book.availability_status || (Number(book.stock) > 0 ? 'available' : 'unavailable')
    };
  };

  const demoBooks = (window.DEMO_BOOKS || []).map(normalizeBook);

  const filterBooks = function (books, filters) {
    const options = filters || {};
    const search = (options.search || '').trim().toLowerCase();
    const category = (options.category || '').trim();
    const status = (options.status || '').trim();
    const sort = options.sort || 'title';

    let result = [...books];

    if (search) {
      result = result.filter(function (book) {
        return (book.title || '').toLowerCase().includes(search) || (book.author || '').toLowerCase().includes(search);
      });
    }

    if (category) {
      result = result.filter(function (book) {
        return (book.category || '') === category;
      });
    }

    if (status) {
      result = result.filter(function (book) {
        return (book.availability_status || 'available') === status;
      });
    }

    if (sort === 'author') {
      result.sort(function (a, b) {
        return (a.author || '').localeCompare(b.author || '');
      });
    } else if (sort === 'newest') {
      result.sort(function (a, b) {
        return String(b.book_id).localeCompare(String(a.book_id));
      });
    } else if (sort === 'stock') {
      result.sort(function (a, b) {
        return Number(b.stock) - Number(a.stock);
      });
    } else {
      result.sort(function (a, b) {
        return (a.title || '').localeCompare(b.title || '');
      });
    }

    return result;
  };

  const fetchBooksFromSupabase = async function (filters) {
    if (!window.supabaseClient) {
      return {
        data: [],
        error: { message: 'Supabase is not configured yet. Add your project URL and anon key to enable live catalog data.' }
      };
    }

    let query = window.supabaseClient.from('books').select('*');

    const search = (filters.search || '').trim();
    const categoryValue = (filters.category || '').trim();
    const statusValue = (filters.status || '').trim();
    const sort = filters.sort || 'title';

    if (search) {
      query = query.ilike('title', `%${search}%`).or(`author.ilike.%${search}%`);
    }

    if (categoryValue) {
      query = query.eq('category', categoryValue);
    }

    if (statusValue) {
      query = query.eq('availability_status', statusValue);
    }

    if (sort === 'author') {
      query = query.order('author', { ascending: true });
    } else if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'stock') {
      query = query.order('stock', { ascending: false });
    } else {
      query = query.order('title', { ascending: true });
    }

    const { data, error } = await query;
    return { data: data || [], error };
  };

  const fetchBookByIdFromSupabase = async function (id) {
    if (!window.supabaseClient) {
      return {
        data: null,
        error: { message: 'Supabase is not configured yet. Add your project URL and anon key to enable live book details.' }
      };
    }

    const { data, error } = await window.supabaseClient.from('books').select('*').eq('book_id', id).single();
    return { data: data || null, error };
  };

  window.libraryData = {
    mode: dataMode,
    getBooks: async function (filters) {
      if (dataMode === 'demo') {
        return { data: filterBooks(demoBooks, filters), error: null };
      }

      return fetchBooksFromSupabase(filters || {});
    },
    getBookById: async function (id) {
      if (dataMode === 'demo') {
        const found = demoBooks.find(function (book) {
          return String(book.book_id) === String(id);
        });

        return { data: found || null, error: found ? null : { message: 'Demo book not found.' } };
      }

      return fetchBookByIdFromSupabase(id);
    }
  };
})();