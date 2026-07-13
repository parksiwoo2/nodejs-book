document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bookSearchForm');
  const queryInput = document.getElementById('bookQuery');
  const bookList = document.getElementById('bookList');
  const bookLoading = document.getElementById('bookLoading');
  const bookMessage = document.getElementById('bookMessage');
  const resultMeta = document.getElementById('resultMeta');
  const pagination = document.getElementById('pagination');
  const pageInfo = document.getElementById('pageInfo');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');

  const PAGE_SIZE = 10;
  let currentPage = 1;
  let currentQuery = '';
  let totalCount = 0;

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };

    if (token) {
      headers.Authorization = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
    }

    return headers;
  };

  const setMessage = (message, type = '') => {
    bookMessage.className = type ? `message ${type}` : 'message';
    bookMessage.textContent = message;
  };

  const escapeHtml = (str = '') =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const getErrorMessage = (result, fallback) => {
    if (result?.error?.message) return result.error.message;
    if (result?.message) return result.message;
    return fallback;
  };

  const totalPages = () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const updatePagination = () => {
    if (totalCount === 0) {
      pagination.hidden = true;
      resultMeta.textContent = '';
      return;
    }

    pagination.hidden = false;
    resultMeta.textContent = `총 ${totalCount.toLocaleString()}건`;
    pageInfo.textContent = `${currentPage} / ${totalPages()}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages();
  };

  const searchBooks = async (q, page = 1) => {
    bookLoading.hidden = false;
    bookList.innerHTML = '';
    setMessage('');

    try {
      const params = new URLSearchParams({
        q,
        page: String(page)
      });

      const response = await fetch(`/api/book/search?${params}`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(getErrorMessage(result, '책 검색에 실패했습니다.'));
      }

      currentQuery = q;
      currentPage = result.data.page || page;
      totalCount = result.data.total || 0;

      renderBooks(result.data.items || []);
      updatePagination();

      if (!result.data.items || result.data.items.length === 0) {
        setMessage('검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message, 'error');
      resultMeta.textContent = '';
      pagination.hidden = true;
    } finally {
      bookLoading.hidden = true;
    }
  };

  const renderBooks = (items) => {
    if (!items.length) {
      bookList.innerHTML = '';
      return;
    }

    bookList.innerHTML = items
      .map((item, index) => {
        const title = escapeHtml(item.title);
        const author = escapeHtml(item.author);
        const publisher = escapeHtml(item.publisher || '-');
        const thumb = item.thumbnail
          ? `<img class="book-thumb" src="${escapeHtml(item.thumbnail)}" alt="${title} 표지" />`
          : '<div class="book-thumb-placeholder">No Image</div>';

        return `
          <li class="list-item book-item" data-index="${index}">
            ${thumb}
            <div class="book-info">
              <div class="book-title">${title}</div>
              <p class="book-meta">저자: ${author}</p>
              <p class="book-meta">출판사: ${publisher}</p>
            </div>
            <div class="book-actions">
              <button type="button" class="register-btn">DB에 추가</button>
            </div>
          </li>
        `;
      })
      .join('');
  };

  const registerBook = async (title, author, button) => {
    button.disabled = true;
    setMessage('');

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, author })
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(getErrorMessage(result, '책 등록에 실패했습니다.'));
      }

      const book = result.data;
      if (response.status === 201) {
        setMessage(`「${book.title}」이(가) DB에 등록되었습니다.`, 'success');
      } else {
        setMessage(`「${book.title}」은(는) 이미 DB에 있습니다.`, 'success');
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message, 'error');
    } finally {
      button.disabled = false;
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const q = queryInput.value.trim();
    if (!q) {
      setMessage('검색어를 입력하세요.', 'error');
      return;
    }
    searchBooks(q, 1);
  });

  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1 && currentQuery) {
      searchBooks(currentQuery, currentPage - 1);
    }
  });

  nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages() && currentQuery) {
      searchBooks(currentQuery, currentPage + 1);
    }
  });

  bookList.addEventListener('click', (event) => {
    const button = event.target.closest('.register-btn');
    if (!button) return;

    // data-* 는 HTML 이스케이프된 값이므로 textContent 기준으로 원문 복원
    const li = button.closest('.book-item');
    const titleEl = li?.querySelector('.book-title');
    const authorEl = li?.querySelector('.book-meta');

    const title = titleEl?.textContent?.trim() || '';
    // 첫 번째 book-meta: "저자: ..."
    const authorText = authorEl?.textContent || '';
    const author = authorText.replace(/^저자:\s*/, '').trim();

    if (!title || !author) {
      setMessage('제목 또는 저자 정보가 없습니다.', 'error');
      return;
    }

    registerBook(title, author, button);
  });
});
