// 독후감 페이지 — 목록/상세/작성/수정/삭제 + 댓글 + 책 검색(네이버 프록시)
// 사용 API: /api/book-report*, /api/book/search, /api/book

const $ = (id) => document.getElementById(id);

// ---------- 인증 (reading.js와 동일 패턴) ----------
function getAuthHeader() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

// JWT payload에서 내 유저 id (UI 표시 용도 — 진짜 검증은 서버가 함)
function getMyUserId() {
  const auth = getAuthHeader();
  if (!auth) return null;
  try {
    return JSON.parse(atob(auth.split(' ')[1].split('.')[1])).id;
  } catch (e) {
    return null;
  }
}

const myUserId = getMyUserId();

if (!getAuthHeader()) {
  alert('로그인이 필요합니다.');
  window.location.href = '/login';
}

// ---------- 공통 fetch (팀 에러 envelope 처리) ----------
async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
      ...options.headers
    }
  });
  if (res.status === 401) {
    alert('로그인이 만료되었습니다. 다시 로그인해 주세요.');
    window.location.href = '/login';
    return null;
  }
  const body = await res.json().catch(() => null);
  if (!body || body.success === false) {
    const msg = body && body.error ? body.error.message : '요청에 실패했습니다.';
    alert(msg);
    return null;
  }
  return body.data !== undefined ? body.data : body;
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

// ---------- 화면 전환 ----------
function show(section) {
  $('writeSection').style.display = section === 'write' ? 'block' : 'none';
  $('listSection').style.display = section === 'list' ? 'block' : 'none';
  $('detailSection').style.display = section === 'detail' ? 'block' : 'none';
}

// ---------- 목록 ----------
let page = 1;
const limit = 10;
let currentReport = null;

async function loadList() {
  const data = await api(`/book-report?page=${page}&limit=${limit}`);
  if (!data) return;

  $('reportList').innerHTML = data.items.length
    ? data.items.map((r) => `
        <li class="list-item report-item" data-id="${r._id}">
          <strong>${esc(r.title)}</strong>
          <p class="muted">${esc(r.book.title)} (${esc(r.book.author)}) · ${esc(r.user.name)} · 댓글 ${r.commentCount}</p>
        </li>`).join('')
    : '<li class="list-item"><p>아직 독후감이 없습니다. 첫 독후감을 남겨보세요!</p></li>';

  const lastPage = Math.max(1, Math.ceil(data.total / limit));
  $('pageInfo').textContent = `${data.page} / ${lastPage}`;
  $('btnPrev').disabled = data.page <= 1;
  $('btnNext').disabled = data.page >= lastPage;

  document.querySelectorAll('.report-item').forEach((el) => {
    el.addEventListener('click', () => loadDetail(el.dataset.id));
  });
  show('list');
}

// ---------- 상세 + 댓글 ----------
async function loadDetail(id) {
  const r = await api(`/book-report/${id}`);
  if (!r) return;
  currentReport = r;

  $('dTitle').textContent = r.title;
  $('dMeta').textContent =
    `${r.book.title} (${r.book.author}) · ${r.user.name} · ${new Date(r.createdDt).toLocaleDateString('ko-KR')}`;
  $('dContents').textContent = r.contents;

  const mine = myUserId && r.user._id === myUserId;
  $('btnEditReport').style.display = mine ? 'inline-block' : 'none';
  $('btnDeleteReport').style.display = mine ? 'inline-block' : 'none';

  $('commentList').innerHTML = r.comments.length
    ? r.comments.map((c) => `
        <div class="comment">
          <span class="writer">${esc(c.writer.name)}</span>
          <span>${esc(c.content)}</span>
          ${myUserId && c.writer._id === myUserId ? `
            <button data-edit="${c._id}">수정</button>
            <button data-del="${c._id}">삭제</button>` : ''}
        </div>`).join('')
    : '<p class="muted">첫 댓글을 남겨보세요.</p>';

  document.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => editComment(btn.dataset.edit));
  });
  document.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => deleteComment(btn.dataset.del));
  });
  show('detail');
}

// ---------- 책 검색/선택 ----------
let selectedBook = null; // { title, author }

async function searchBooks() {
  const q = $('bookQuery').value.trim();
  if (!q) {
    alert('검색어를 입력해주세요.');
    return;
  }
  const data = await api(`/book/search?q=${encodeURIComponent(q)}&page=1`);
  if (!data) return;

  $('bookResults').innerHTML = data.items.length
    ? data.items.map((b, i) => `
        <li class="list-item book-result" data-i="${i}">
          <strong>${esc(b.title)}</strong>
          <p class="muted">${esc(b.author) || '저자 미상'}${b.publisher ? ` · ${esc(b.publisher)}` : ''}</p>
        </li>`).join('')
    : '<li class="list-item"><p>검색 결과가 없어요.</p></li>';

  document.querySelectorAll('.book-result').forEach((el) => {
    el.addEventListener('click', () => {
      const b = data.items[el.dataset.i];
      selectedBook = { title: b.title, author: b.author };
      $('bookResults').innerHTML = '';
      $('bookSelected').style.display = 'block';
      $('bookSelected').textContent = `선택된 책: ${b.title} — ${b.author}`;
    });
  });
}

$('btnBookSearch').addEventListener('click', searchBooks);
$('bookQuery').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // 폼 제출 방지
    searchBooks();
  }
});

// ---------- 작성 ----------
$('writeForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!selectedBook) {
    alert('책을 검색해서 선택해주세요.');
    return;
  }

  // 선택한 책을 등록(이미 있으면 기존 반환)하고 _id 사용
  const book = await api('/book', {
    method: 'POST',
    body: JSON.stringify(selectedBook)
  });
  if (!book) return;

  const created = await api('/book-report', {
    method: 'POST',
    body: JSON.stringify({
      title: $('wTitle').value,
      contents: $('wContents').value,
      bookId: book._id
    })
  });
  if (!created) return;

  e.target.reset();
  selectedBook = null;
  $('bookSelected').style.display = 'none';
  page = 1;
  loadList();
});

// ---------- 수정/삭제 ----------
$('btnEditReport').addEventListener('click', async () => {
  const title = prompt('새 제목 (취소하면 유지)', currentReport.title);
  const contents = prompt('새 내용 (취소하면 유지)', currentReport.contents);
  if (title === null && contents === null) return;
  const updated = await api(`/book-report/${currentReport._id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...(title !== null && { title }),
      ...(contents !== null && { contents })
    })
  });
  if (updated) loadDetail(currentReport._id);
});

$('btnDeleteReport').addEventListener('click', async () => {
  if (!confirm('독후감을 삭제할까요? 댓글도 함께 삭제됩니다.')) return;
  const del = await api(`/book-report/${currentReport._id}`, { method: 'DELETE' });
  if (del) loadList();
});

// ---------- 댓글 ----------
$('commentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const created = await api(`/book-report/${currentReport._id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content: $('cContent').value })
  });
  if (!created) return;
  e.target.reset();
  loadDetail(currentReport._id);
});

async function editComment(commentId) {
  const c = currentReport.comments.find((x) => x._id === commentId);
  const content = prompt('댓글 수정', c ? c.content : '');
  if (content === null || !content.trim()) return;
  const updated = await api(`/book-report/${currentReport._id}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content })
  });
  if (updated) loadDetail(currentReport._id);
}

async function deleteComment(commentId) {
  if (!confirm('댓글을 삭제할까요?')) return;
  const del = await api(`/book-report/${currentReport._id}/comments/${commentId}`, { method: 'DELETE' });
  if (del) loadDetail(currentReport._id);
}

// ---------- 네비게이션 ----------
$('btnShowWrite').addEventListener('click', () => show('write'));
$('btnCancelWrite').addEventListener('click', () => show('list'));
$('btnBack').addEventListener('click', () => loadList());
$('btnRefresh').addEventListener('click', () => loadList());
$('btnPrev').addEventListener('click', () => { page -= 1; loadList(); });
$('btnNext').addEventListener('click', () => { page += 1; loadList(); });

loadList();
