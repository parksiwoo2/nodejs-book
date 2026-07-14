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

function getRoomIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return (params.get('id') || '').trim();
}

function getElements() {
  return {
    loading: document.getElementById('roomDetailLoading'),
    errorBox: document.getElementById('roomDetailError'),
    errorMessage: document.getElementById('roomDetailErrorMessage'),
    errorLink: document.getElementById('roomDetailErrorLink'),
    content: document.getElementById('roomDetailContent'),
    title: document.getElementById('roomDetailTitle'),
    summary: document.getElementById('roomDetailSummary'),
    master: document.getElementById('roomDetailMaster'),
    book: document.getElementById('roomDetailBook'),
    members: document.getElementById('roomDetailMembers'),
    leaveBtn: document.getElementById('leaveRoomShellBtn')
  };
}

function showLoading() {
  const { loading, errorBox, content } = getElements();
  if (loading) loading.hidden = false;
  if (errorBox) errorBox.hidden = true;
  if (content) content.hidden = true;
}

function showError(message, linkHref, linkText) {
  const { loading, errorBox, errorMessage, errorLink, content } = getElements();
  if (loading) loading.hidden = true;
  if (content) content.hidden = true;
  if (errorBox) errorBox.hidden = false;
  if (errorMessage) errorMessage.textContent = message;
  if (errorLink) {
    errorLink.href = linkHref || '/room';
    errorLink.textContent = linkText || '방 목록으로';
  }
}

function showContent() {
  const { loading, errorBox, content } = getElements();
  if (loading) loading.hidden = true;
  if (errorBox) errorBox.hidden = true;
  if (content) content.hidden = false;
}

function renderMembers(room) {
  const { members: listEl } = getElements();
  if (!listEl) return;

  listEl.innerHTML = '';
  const members = Array.isArray(room.members) ? room.members : [];
  const masterId = room.master?._id ? String(room.master._id) : '';

  if (members.length === 0) {
    listEl.innerHTML = '<li class="list-item room-empty">멤버가 없습니다.</li>';
    return;
  }

  members.forEach((member) => {
    const li = document.createElement('li');
    li.className = 'list-item room-member-item';
    const name = member.name || '-';
    const memberId = member._id ? String(member._id) : '';
    const isMaster = masterId && memberId && masterId === memberId;

    li.innerHTML = `
      <span class="room-member-name">${escapeHtml(name)}</span>
      ${isMaster ? '<span class="room-master-badge">개설자</span>' : ''}
    `;
    listEl.appendChild(li);
  });
}

function renderRoomDetail(room) {
  const { title, summary, master, book } = getElements();

  const memberCount =
    room.memberCount ??
    (Array.isArray(room.members) ? room.members.length : 0);
  const createdAt = formatDate(room.createdAt);
  const bookTitle = room.book?.title || '-';
  const bookAuthor = room.book?.author ? ` (${room.book.author})` : '';

  if (title) title.textContent = room.title || '-';
  if (summary) {
    summary.textContent = `생성일 ${createdAt} · 참여 인원 ${memberCount}명`;
  }
  if (master) master.textContent = room.master?.name || '-';
  if (book) book.textContent = `${bookTitle}${bookAuthor}`;

  renderMembers(room);
  showContent();
}

async function fetchRoomDetail() {
  const roomId = getRoomIdFromQuery();

  if (!roomId) {
    showError('방 정보가 없습니다. 목록에서 다시 선택해 주세요.', '/room', '방 목록으로');
    return;
  }

  const authorization = getAuthHeader();
  if (!authorization) {
    showError('로그인이 필요합니다.', '/login', '로그인');
    return;
  }

  showLoading();

  try {
    const response = await fetch(`/api/room/${encodeURIComponent(roomId)}`, {
      method: 'GET',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.status === 401) {
      showError('로그인이 만료되었습니다. 다시 로그인해 주세요.', '/login', '로그인');
      return;
    }

    const code = result.error?.code;
    const message = result.error?.message || result.message;

    if (code === 'FORBIDDEN' || (response.status === 403) ||
        (message && message.includes('참여하지'))) {
      showError(
        '참여하지 않은 방입니다. 목록에서 가입한 뒤 이용해 주세요.',
        '/room',
        '방 목록으로'
      );
      return;
    }

    if (code === 'ROOM_NOT_FOUND' || response.status === 404) {
      showError('존재하지 않는 방입니다.', '/room', '방 목록으로');
      return;
    }

    if (!response.ok || !result.success) {
      showError(
        message || '방 상세를 불러오지 못했습니다.',
        '/room',
        '방 목록으로'
      );
      return;
    }

    const room = result.Room;
    if (!room) {
      showError('방 정보가 없습니다.', '/room', '방 목록으로');
      return;
    }

    renderRoomDetail(room);
  } catch (error) {
    console.error('방 상세 조회 오류:', error);
    showError('서버 연결에 실패했습니다.', '/room', '방 목록으로');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const { leaveBtn } = getElements();

  if (leaveBtn) {
    // 껍데기 버튼 — leave API 미호출
    leaveBtn.addEventListener('click', () => {
      alert('탈퇴 기능은 준비 중입니다.');
    });
  }

  fetchRoomDetail();
});
