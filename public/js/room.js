function getAuthHeader() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** createdAt → YYYY-MM-DD */
function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getElements() {
  return {
    container: document.getElementById('roomListContainer'),
    loading: document.getElementById('roomLoading'),
    status: document.getElementById('roomStatusMessage'),
    refreshBtn: document.getElementById('refreshRoomListBtn'),
    createForm: document.getElementById('createRoomForm'),
    roomTitle: document.getElementById('roomTitle'),
    bookSelect: document.getElementById('roomBookSelect'),
    createBtn: document.getElementById('createRoomBtn'),
    reloadBooksBtn: document.getElementById('reloadBooksBtn')
  };
}

function setLoading(isLoading) {
  const { loading } = getElements();
  if (!loading) return;
  loading.hidden = !isLoading;
}

function setStatus(message, type) {
  const { status } = getElements();
  if (!status) return;
  status.textContent = message || '';
  status.classList.remove('success', 'error');
  if (type) status.classList.add(type);
}

function setCreateFormBusy(isBusy) {
  const { createBtn, reloadBooksBtn, roomTitle, bookSelect } = getElements();
  if (createBtn) {
    createBtn.disabled = isBusy;
    createBtn.textContent = isBusy ? '만드는 중…' : '방 만들기';
  }
  if (reloadBooksBtn) reloadBooksBtn.disabled = isBusy;
  if (roomTitle) roomTitle.disabled = isBusy;
  if (bookSelect) bookSelect.disabled = isBusy;
}

function renderLoading() {
  const { container } = getElements();
  if (!container) return;
  container.innerHTML = '';
  setStatus('');
  setLoading(true);
}

function renderError(message) {
  const { container } = getElements();
  if (!container) return;
  setLoading(false);
  setStatus('');
  container.innerHTML = `<p class="room-error">${escapeHtml(message)}</p>`;
}

function renderEmpty() {
  const { container } = getElements();
  if (!container) return;
  setLoading(false);
  setStatus('');
  container.innerHTML =
    '<p class="room-empty">개설된 방이 없습니다. 첫 번째 방을 만들어보세요!</p>';
}

function createRoomCard(room) {
  const memberCount =
    room.memberCount ??
    (Array.isArray(room.members) ? room.members.length : 0);
  const masterName = room.master?.name || '-';
  const bookTitle = room.book?.title || '-';
  const bookAuthor = room.book?.author ? ` (${room.book.author})` : '';
  const createdAt = formatDate(room.createdAt);
  const roomId = room._id || '';

  const card = document.createElement('div');
  card.className = 'room-card';
  card.setAttribute('role', 'link');
  card.setAttribute('tabindex', '0');
  if (roomId) {
    card.dataset.roomId = roomId;
  }
  card.innerHTML = `
    <div class="room-card-body">
      <h3 class="room-card-title">${escapeHtml(room.title || '-')}</h3>
      <p class="room-card-meta">개설자: ${escapeHtml(masterName)} · 참여 인원: ${escapeHtml(String(memberCount))}명</p>
      <p class="room-card-meta">선정 도서: ${escapeHtml(bookTitle)}${escapeHtml(bookAuthor)}</p>
      <p class="room-card-meta">생성일: ${escapeHtml(createdAt)}</p>
    </div>
    <div class="room-card-actions">
      <button class="join-btn" type="button" data-id="${escapeHtml(roomId)}">가입하기</button>
    </div>
  `;
  return card;
}

function goToRoomDetail(roomId) {
  if (!roomId) return;
  window.location.href = `/room-detail?id=${encodeURIComponent(roomId)}`;
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  window.location.href = '/login';
}

function renderRoomList(rooms) {
  const { container } = getElements();
  if (!container) return;

  setLoading(false);
  setStatus('');
  container.innerHTML = '';

  if (!rooms.length) {
    renderEmpty();
    return;
  }

  rooms.forEach((room) => {
    container.appendChild(createRoomCard(room));
  });
}

async function fetchRoomList() {
  const { container } = getElements();
  if (!container) {
    console.error('roomListContainer 요소를 찾을 수 없습니다.');
    return;
  }

  const authorization = getAuthHeader();
  if (!authorization) {
    setLoading(false);
    setStatus('');
    container.innerHTML =
      '<p class="room-empty">로그인이 필요합니다. <a class="text-link" href="/login">로그인</a> 후 이용해주세요.</p>';
    return;
  }

  renderLoading();

  try {
    const response = await fetch('/api/room/list', {
      method: 'GET',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.status === 401) {
      setLoading(false);
      container.innerHTML =
        '<p class="room-empty">로그인이 만료되었습니다. <a class="text-link" href="/login">다시 로그인</a>해주세요.</p>';
      return;
    }

    if (!response.ok || !result.success) {
      const message =
        result.error?.message || result.message || '방 목록을 불러오지 못했습니다.';
      renderError(message);
      return;
    }

    const rooms = Array.isArray(result.rooms) ? result.rooms : [];
    renderRoomList(rooms);
  } catch (error) {
    console.error('방 목록을 불러오는 중 오류 발생:', error);
    renderError('서버 연결에 실패했습니다.');
  }
}

async function handleJoinRoom(roomId) {
  if (!roomId) return;

  const authorization = getAuthHeader();
  if (!authorization) {
    alert('로그인이 필요합니다.');
    window.location.href = '/login';
    return;
  }

  try {
    const response = await fetch(`/api/room/${roomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization
      }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert(result.message || '방 가입에 성공했습니다!');
      await fetchRoomList();
    } else {
      alert(
        `가입 실패: ${result.error?.message || result.message || '알 수 없는 오류'}`
      );
    }
  } catch (error) {
    console.error('서버 통신 에러:', error);
    alert('서버 연결에 실패했습니다.');
  }
}

/**
 * DB 등록 책 목록 → 선정 도서 select 채우기 (B-2)
 * GET /api/book → { success, data: { books } }
 */
async function loadRegisteredBooks() {
  const { bookSelect } = getElements();
  if (!bookSelect) return;

  const authorization = getAuthHeader();
  if (!authorization) {
    bookSelect.innerHTML = '<option value="">로그인이 필요합니다</option>';
    return;
  }

  const previousValue = bookSelect.value;
  bookSelect.disabled = true;
  bookSelect.innerHTML = '<option value="">책을 불러오는 중…</option>';

  try {
    const response = await fetch('/api/book', {
      method: 'GET',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.status === 401) {
      bookSelect.innerHTML = '<option value="">로그인이 만료되었습니다</option>';
      return;
    }

    if (!response.ok || !result.success) {
      const message =
        result.error?.message || result.message || '책 목록을 불러오지 못했습니다.';
      bookSelect.innerHTML = `<option value="">${escapeHtml(message)}</option>`;
      return;
    }

    const books = Array.isArray(result.data?.books) ? result.data.books : [];

    if (books.length === 0) {
      bookSelect.innerHTML =
        '<option value="">등록된 책이 없습니다. 책 등록 후 이용하세요.</option>';
      return;
    }

    bookSelect.innerHTML = '<option value="">선정할 책을 선택하세요</option>';
    books.forEach((book) => {
      const option = document.createElement('option');
      option.value = book._id;
      const title = book.title || '(제목 없음)';
      const author = book.author ? ` — ${book.author}` : '';
      option.textContent = `${title}${author}`;
      bookSelect.appendChild(option);
    });

    if (previousValue && books.some((b) => String(b._id) === previousValue)) {
      bookSelect.value = previousValue;
    }
  } catch (error) {
    console.error('책 목록 조회 오류:', error);
    bookSelect.innerHTML = '<option value="">서버 연결에 실패했습니다</option>';
  } finally {
    bookSelect.disabled = false;
  }
}

async function handleCreateRoom(event) {
  event.preventDefault();

  const { roomTitle, bookSelect } = getElements();
  const title = roomTitle?.value?.trim() || '';
  const bookId = bookSelect?.value?.trim() || '';

  if (!title) {
    alert('방 제목을 입력해주세요.');
    return;
  }

  if (!bookId) {
    alert('선정 도서를 선택해주세요. 등록된 책이 없으면 책 등록 페이지를 이용하세요.');
    return;
  }

  const authorization = getAuthHeader();
  if (!authorization) {
    alert('로그인이 필요합니다.');
    window.location.href = '/login';
    return;
  }

  setCreateFormBusy(true);

  try {
    const response = await fetch('/api/room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization
      },
      body: JSON.stringify({ title, bookId })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert(result.message || '방을 생성했습니다!');
      if (roomTitle) roomTitle.value = '';
      if (bookSelect) bookSelect.value = '';
      const newRoomId = result.data?.Room?._id;
      if (newRoomId) {
        goToRoomDetail(newRoomId);
        return;
      }
      await fetchRoomList();
    } else {
      alert(
        `생성 실패: ${result.error?.message || result.message || '알 수 없는 오류'}`
      );
    }
  } catch (error) {
    console.error('방 생성 오류:', error);
    alert('서버 연결에 실패했습니다.');
  } finally {
    setCreateFormBusy(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const { container, refreshBtn, createForm, reloadBooksBtn } = getElements();
  const logoutBtn = document.getElementById('roomLogoutBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchRoomList();
    });
  }

  if (container) {
    container.addEventListener('click', (event) => {
      const button = event.target.closest('.join-btn');
      if (button) {
        event.stopPropagation();
        handleJoinRoom(button.getAttribute('data-id'));
        return;
      }

      const card = event.target.closest('.room-card');
      if (card?.dataset.roomId) {
        goToRoomDetail(card.dataset.roomId);
      }
    });

    container.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest('.room-card');
      if (!card || event.target.closest('.join-btn')) return;
      event.preventDefault();
      if (card.dataset.roomId) {
        goToRoomDetail(card.dataset.roomId);
      }
    });
  }

  if (createForm) {
    createForm.addEventListener('submit', handleCreateRoom);
  }

  if (reloadBooksBtn) {
    reloadBooksBtn.addEventListener('click', () => {
      loadRegisteredBooks();
    });
  }

  loadRegisteredBooks();
  fetchRoomList();
});
