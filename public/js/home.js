// 통합 페이지 — 홈 / 독후감 / 독서 모임 탭
// 팀원 페이지(타이머·기록·랭킹·마이페이지)는 건드리지 않고 링크로만 연결
if (!kulug.requireLogin()) throw new Error('redirect');

const { api, esc, myUserId } = kulug;
const $ = (id) => document.getElementById(id);

// ==================== 탭 ====================
const TABS = ['home', 'reports', 'rooms', 'time', 'rank'];
const SECTIONS = [...TABS, 'room']; // room = 모임 상세 (네비엔 없음, #room-<id>로 진입)

function showTab(name, hash, skipLoad) {
  SECTIONS.forEach((t) => {
    $(`tab-${t}`).classList.toggle('active', t === name);
  });
  if (history.replaceState) history.replaceState(null, '', `#${hash || name}`);
  if (skipLoad) {
    updateNavActive(name);
    return;
  }

  updateNavActive(name);

  if (name === 'home') loadRecent();
  if (name === 'reports') loadReports();
  if (name === 'rooms') loadRooms();
  if (name === 'time') loadReadingLog();
  if (name === 'rank') loadRanking();
}

// 상단 네비게이션 하이라이트를 현재 탭에 맞춤 (방 페이지는 '독서 모임' 유지)
function updateNavActive(name) {
  const navName = name === 'room' ? 'rooms' : name;
  document.querySelectorAll('.site-nav .nav-link').forEach((a) => {
    const href = a.getAttribute('href') || '';
    const hash = href.includes('#') ? href.split('#')[1] : 'home';
    a.classList.toggle('active', href.startsWith('/home') && hash === navName);
  });
}
document.querySelectorAll('[data-goto]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    showTab(el.dataset.goto);
  });
});

// ==================== 홈 ====================
async function loadRecent() {
  const box = $('recentReports');
  const data = await api('/book-report?page=1&limit=5');
  if (!data) return;

  box.innerHTML = data.items.length
    ? `<div class="stack">${data.items.map((r) => `
        <div class="card clickable report-link" data-id="${r._id}">
          <strong>${esc(r.title)}</strong>
          <p class="meta">📖 ${esc(r.book.title)} · ✍️ ${esc(r.user.name)} · 💬 ${r.commentCount}</p>
        </div>`).join('')}</div>`
    : '<p class="empty">아직 독후감이 없어요. 첫 독후감을 남겨보세요!</p>';

  box.querySelectorAll('.report-link').forEach((el) => {
    el.addEventListener('click', () => {
      showTab('reports');
      loadReportDetail(el.dataset.id);
    });
  });
}

// ==================== 독후감 ====================
let page = 1;
const limit = 10;
let currentReport = null;

// 방 모드: 모임 카드 클릭으로 진입. 그 방에서 작성된 독후감만 보고 쓰기.
let currentRoom = null; // { id, title, bookId, bookTitle }

const reportPicker = kulug.createBookPicker($('reportPickerMount'));

function reportShow(view) {
  $('reportWriteBox').style.display = view === 'write' ? 'block' : 'none';
  $('reportListBox').style.display = view === 'list' ? 'block' : 'none';
  $('reportDetailBox').style.display = view === 'detail' ? 'block' : 'none';
}

function updateRoomBanner() {
  const banner = $('roomBanner');
  if (currentRoom) {
    banner.style.display = 'block';
    banner.innerHTML =
      `<span class="badge">🏠 ${esc(currentRoom.title)}</span> ` +
      `<span class="badge">📖 ${esc(currentRoom.bookTitle)}</span> 이 방에서 작성된 독후감만 보입니다`;
    $('btnExitRoom').style.display = 'inline-block';
    $('bookPickField').style.display = 'none'; // 책은 모임 책으로 자동 지정
  } else {
    banner.style.display = 'none';
    $('btnExitRoom').style.display = 'none';
    $('bookPickField').style.display = 'block';
  }
}

async function loadReports() {
  updateRoomBanner();

  // 방 모드: 서버가 그 방에서 작성된 독후감만 필터해서 줌
  const roomParam = currentRoom ? `&roomId=${currentRoom.id}` : '';
  const data = await api(`/book-report?page=${page}&limit=${limit}${roomParam}`);
  if (!data) return;

  $('reportList').innerHTML = data.items.length
    ? data.items.map((r) => `
        <div class="card clickable" data-id="${r._id}">
          <h4>${esc(r.title)}</h4>
          <p class="meta">
            📖 ${esc(r.book.title)} (${esc(r.book.author)})
            · ✍️ ${esc(r.user.name)}
            · 💬 ${r.commentCount}${r.room && !currentRoom ? ` · <span class="badge">🏠 ${esc(r.room.title)}</span>` : ''}
          </p>
        </div>`).join('')
    : `<p class="empty">${currentRoom ? '이 방의 독후감이 아직 없어요. 첫 독후감을 남겨보세요!' : '아직 독후감이 없습니다. 첫 독후감을 남겨보세요!'}</p>`;

  const lastPage = Math.max(1, Math.ceil(data.total / limit));
  $('pageInfo').textContent = `${data.page} / ${lastPage}`;
  $('btnPrev').disabled = data.page <= 1;
  $('btnNext').disabled = data.page >= lastPage;

  document.querySelectorAll('#reportList .card').forEach((card) => {
    card.addEventListener('click', () => loadReportDetail(card.dataset.id));
  });
  reportShow('list');
}

async function loadReportDetail(id) {
  const r = await api(`/book-report/${id}`);
  if (!r) return;
  currentReport = r;

  $('dTitle').textContent = r.title;
  $('dMeta').textContent =
    `📖 ${r.book.title} (${r.book.author}) · ✍️ ${r.user.name} · ${new Date(r.createdDt).toLocaleDateString('ko-KR')}`;
  $('dContents').textContent = r.contents;

  // 작성자 본인일 때만 수정/삭제 노출 (서버가 재검증)
  const mine = myUserId && r.user._id === myUserId;
  $('btnEditReport').style.display = mine ? 'inline-block' : 'none';
  $('btnDeleteReport').style.display = mine ? 'inline-block' : 'none';

  $('commentList').innerHTML = r.comments.length
    ? r.comments.map((c) => `
        <div class="comment-item">
          <span class="writer">${esc(c.writer.name)}</span>
          <span>${esc(c.content)}</span>
          ${myUserId && c.writer._id === myUserId ? `
            <button class="btn-sm btn-ghost" data-edit="${c._id}">수정</button>
            <button class="btn-sm btn-danger" data-del="${c._id}">삭제</button>` : ''}
        </div>`).join('')
    : '<p class="empty" style="padding:12px 0">첫 댓글을 남겨보세요.</p>';

  document.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => editComment(btn.dataset.edit));
  });
  document.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => deleteComment(btn.dataset.del));
  });
  reportShow('detail');
}

$('writeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    title: $('wTitle').value,
    contents: $('wContents').value
  };

  if (currentRoom) {
    body.roomId = currentRoom.id; // 서버가 방 멤버 확인 + 방의 책으로 자동 지정
  } else {
    const book = await reportPicker.confirm();
    if (!book) return;
    body.bookId = book._id;
  }

  const created = await api('/book-report', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  if (!created) return;
  e.target.reset();
  reportPicker.clear();
  page = 1;
  loadReports();
});

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
  if (updated) loadReportDetail(currentReport._id);
});

$('btnDeleteReport').addEventListener('click', async () => {
  if (!confirm('독후감을 삭제할까요? 댓글도 함께 삭제됩니다.')) return;
  const del = await api(`/book-report/${currentReport._id}`, { method: 'DELETE' });
  if (del) loadReports();
});

$('commentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const created = await api(`/book-report/${currentReport._id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content: $('cContent').value })
  });
  if (!created) return;
  e.target.reset();
  loadReportDetail(currentReport._id);
});

async function editComment(commentId) {
  const c = currentReport.comments.find((x) => x._id === commentId);
  const content = prompt('댓글 수정', c ? c.content : '');
  if (content === null || !content.trim()) return;
  const updated = await api(`/book-report/${currentReport._id}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content })
  });
  if (updated) loadReportDetail(currentReport._id);
}

async function deleteComment(commentId) {
  if (!confirm('댓글을 삭제할까요?')) return;
  const del = await api(`/book-report/${currentReport._id}/comments/${commentId}`, { method: 'DELETE' });
  if (del) loadReportDetail(currentReport._id);
}

$('btnShowWrite').addEventListener('click', () => reportShow('write'));
$('btnCancelWrite').addEventListener('click', () => reportShow('list'));
$('btnBack').addEventListener('click', () => loadReports());
$('btnReportRefresh').addEventListener('click', () => loadReports());
$('btnPrev').addEventListener('click', () => { page -= 1; loadReports(); });
$('btnNext').addEventListener('click', () => { page += 1; loadReports(); });
$('btnExitRoom').addEventListener('click', () => {
  currentRoom = null;
  page = 1;
  loadReports();
});

// ==================== 독서 모임 ====================
const roomPicker = kulug.createBookPicker($('roomPickerMount'));

let roomsCache = {}; // id → room (방 페이지에서 재사용)

async function loadRooms() {
  const data = await api('/room/list');
  if (!data) return;
  const rooms = data.rooms || data; // {success, rooms:[...]} 형태 대응
  roomsCache = {};
  rooms.forEach((r) => { roomsCache[r._id] = r; });

  $('roomList').innerHTML = rooms.length
    ? rooms.map((r) => {
        const isMaster = r.master && r.master._id === myUserId;
        const isMember = (r.members || []).some((m) => m._id === myUserId);
        const memberArea = isMaster
          ? '<span class="badge">👑 내 모임</span>'
          : isMember
            ? `<span class="badge">참여 중</span>
               <button class="btn-sm btn-ghost" data-leave="${r._id}">나가기</button>`
            : `<button class="btn-sm" data-join="${r._id}">참여하기</button>`;
        return `
        <div class="card clickable" data-id="${r._id}"
             data-title="${esc(r.title)}"
             data-bookid="${r.book?._id ?? ''}"
             data-booktitle="${esc(r.book?.title ?? '')}">
          <h3>${esc(r.title)}</h3>
          <p class="meta">📖 ${esc(r.book?.title ?? '책 미지정')}${r.book?.author ? ` (${esc(r.book.author)})` : ''}</p>
          <p class="meta">👑 ${esc(r.master?.name ?? '?')} · 👥 ${r.memberCount ?? (r.members ? r.members.length : '?')}명</p>
          <p class="toolbar" style="margin:12px 0 0">
            <span class="badge">독후감 보기 →</span>
            ${memberArea}
          </p>
        </div>`;
      }).join('')
    : '<p class="empty">아직 모임이 없어요. 첫 모임을 만들어보세요!</p>';

  // 카드 클릭 → 방 페이지
  document.querySelectorAll('#roomList .card').forEach((card) => {
    card.addEventListener('click', () => openRoomPage(card.dataset.id));
  });

  // 참여/나가기 버튼 (카드 클릭으로 번지지 않게 stopPropagation)
  document.querySelectorAll('[data-join]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const joined = await api(`/room/${btn.dataset.join}/join`, { method: 'POST' });
      if (joined) loadRooms();
    });
  });
  document.querySelectorAll('[data-leave]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('이 모임에서 나갈까요?')) return;
      const left = await api(`/room/${btn.dataset.leave}/leave`, { method: 'DELETE' });
      if (left) loadRooms();
    });
  });
}

// ==================== 방 페이지 (모임 상세) ====================
async function openRoomPage(roomId) {
  // 새로고침·직접 진입이면 목록부터 채움
  if (!roomsCache[roomId]) {
    const data = await api('/room/list');
    if (!data) return;
    (data.rooms || data).forEach((r) => { roomsCache[r._id] = r; });
  }
  const room = roomsCache[roomId];
  if (!room) {
    alert('존재하지 않는 모임입니다.');
    showTab('rooms');
    return;
  }

  const isMaster = room.master && room.master._id === myUserId;
  const isMember = (room.members || []).some((m) => m._id === myUserId);

  $('rpTitle').textContent = room.title;
  $('rpBook').textContent =
    `📖 ${room.book?.title ?? '책 미지정'}${room.book?.author ? ` (${room.book.author})` : ''}`;
  $('rpMaster').textContent =
    `👑 방장 ${room.master?.name ?? '?'} · 👥 ${room.memberCount ?? (room.members || []).length}명 · ${new Date(room.createdAt).toLocaleDateString('ko-KR')} 개설`;

  $('rpMembers').innerHTML = (room.members || []).length
    ? room.members.map((m) =>
        `<span class="badge" style="margin:0 6px 6px 0">${m._id === room.master?._id ? '👑 ' : ''}${esc(m.name ?? '?')}</span>`).join('')
    : '<span class="meta">멤버 정보 없음</span>';

  $('rpActions').innerHTML = isMaster
    ? '<span class="badge">👑 내 모임</span>'
    : isMember
      ? `<span class="badge">참여 중</span> <button class="btn-sm btn-ghost" id="rpLeave">나가기</button>`
      : `<button id="rpJoin">참여하기</button>`;

  const joinBtn = $('rpJoin');
  if (joinBtn) {
    joinBtn.addEventListener('click', async () => {
      const joined = await api(`/room/${roomId}/join`, { method: 'POST' });
      if (joined) { await loadRooms(); openRoomPage(roomId); }
    });
  }
  const leaveBtn = $('rpLeave');
  if (leaveBtn) {
    leaveBtn.addEventListener('click', async () => {
      if (!confirm('이 모임에서 나갈까요?')) return;
      const left = await api(`/room/${roomId}/leave`, { method: 'DELETE' });
      if (left) { await loadRooms(); openRoomPage(roomId); }
    });
  }

  // 이 방에서 작성된 독후감 (서버 필터)
  const reports = await api(`/book-report?page=1&limit=20&roomId=${roomId}`);
  const items = reports ? reports.items : [];
  $('rpReports').innerHTML = items.length
    ? items.map((r) => `
        <div class="card clickable" data-report="${r._id}">
          <h4>${esc(r.title)}</h4>
          <p class="meta">✍️ ${esc(r.user.name)} · 💬 ${r.commentCount}</p>
        </div>`).join('')
    : '<p class="empty">이 방의 독후감이 아직 없어요. 첫 독후감을 남겨보세요!</p>';

  document.querySelectorAll('#rpReports [data-report]').forEach((card) => {
    card.addEventListener('click', () => {
      setRoomMode(room);
      showTab('reports', 'reports', true); // 목록 자동 로드 생략 (상세로 바로)
      updateRoomBanner();
      loadReportDetail(card.dataset.report);
    });
  });

  showTab('room', `room-${roomId}`);
}

function setRoomMode(room) {
  currentRoom = {
    id: room._id,
    title: room.title,
    bookId: room.book?._id,
    bookTitle: room.book?.title ?? ''
  };
}

$('btnRoomBack').addEventListener('click', () => showTab('rooms'));
$('btnRoomWrite').addEventListener('click', () => {
  const roomId = (location.hash.match(/^#room-(.+)$/) || [])[1];
  const room = roomsCache[roomId];
  if (!room || !room.book?._id) {
    alert('이 모임은 책 정보가 없어 독후감을 쓸 수 없어요.');
    return;
  }
  setRoomMode(room);
  showTab('reports', 'reports', true); // 목록 자동 로드 생략 (작성 폼으로 바로)
  updateRoomBanner();
  reportShow('write');
});

$('createForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const book = await roomPicker.confirm();
  if (!book) return;
  const created = await api('/room', {
    method: 'POST',
    body: JSON.stringify({
      title: $('rTitle').value,
      bookId: book._id
    })
  });
  if (!created) return;
  e.target.reset();
  roomPicker.clear();
  $('roomCreateBox').style.display = 'none';
  loadRooms();
});

$('btnShowCreate').addEventListener('click', () => {
  $('roomCreateBox').style.display = 'block';
});
$('btnCancelCreate').addEventListener('click', () => {
  $('roomCreateBox').style.display = 'none';
});
$('btnRoomRefresh').addEventListener('click', loadRooms);

// ==================== 독서 시간 (타이머 + 내 기록) ====================
const timePicker = kulug.createBookPicker($('timePickerMount'));

let timerSeconds = 0;
let timerInterval = null;
let timerRunning = false;

function fmtClock(s) {
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function fmtDuration(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}시간 ${m}분`;
  if (m) return `${m}분 ${sec}초`;
  return `${sec}초`;
}

$('btnTimerStart').addEventListener('click', () => {
  if (timerRunning) return;
  timerRunning = true;
  $('timerCircle').classList.add('active');
  $('btnTimerStart').disabled = true;
  $('btnTimerPause').disabled = false;
  $('btnTimerSave').disabled = false;
  $('timerMessage').textContent = '';
  timerInterval = setInterval(() => {
    timerSeconds += 1;
    $('timeDisplay').textContent = fmtClock(timerSeconds);
  }, 1000);
});

$('btnTimerPause').addEventListener('click', () => {
  if (!timerRunning) return;
  timerRunning = false;
  clearInterval(timerInterval);
  $('timerCircle').classList.remove('active');
  $('btnTimerStart').disabled = false;
  $('btnTimerStart').textContent = '계속';
  $('btnTimerPause').disabled = true;
});

$('btnTimerSave').addEventListener('click', async () => {
  if (timerSeconds === 0) {
    $('timerMessage').textContent = '독서 시간이 0초입니다.';
    return;
  }
  const book = await timePicker.confirm();
  if (!book) return;

  timerRunning = false;
  clearInterval(timerInterval);
  $('timerCircle').classList.remove('active');

  const saved = await api('/reading', {
    method: 'POST',
    body: JSON.stringify({ bookId: book._id, readingTime: timerSeconds })
  });
  if (!saved) return;

  $('timerMessage').textContent = `저장 완료! ${fmtDuration(timerSeconds)} 기록됐어요.`;
  timerSeconds = 0;
  $('timeDisplay').textContent = fmtClock(0);
  $('btnTimerStart').textContent = '시작';
  $('btnTimerStart').disabled = false;
  $('btnTimerPause').disabled = true;
  $('btnTimerSave').disabled = true;
  loadReadingLog();
});

async function loadReadingLog() {
  const data = await api('/readinglog');
  if (!data) return;

  $('totalTime').textContent = fmtDuration(data.totalReadingTime || 0);

  const logs = [...(data.readinglog || [])].reverse(); // 최신순
  $('logList').innerHTML = logs.length
    ? logs.slice(0, 20).map((log) => `
        <div class="comment-item">
          📖 <strong>${esc(log.bookTitle || '제목 없음')}</strong>
          · ${fmtDuration(log.readingTime)}
          · <span class="meta">${new Date(log.readDt).toLocaleDateString('ko-KR')}</span>
        </div>`).join('')
    : '<p class="empty" style="padding:12px 0">아직 기록이 없어요. 타이머로 첫 기록을 남겨보세요!</p>';
}

// ==================== 랭킹 ====================
async function loadRanking() {
  const period = $('rankPeriod').value;
  const res = await api(`/book-ranking?period=${period}&page=1&limit=10`);
  if (!res) return;
  // 응답: { BookRanking: { rankings: [...], totalCount, ... } }
  const rows = (res.BookRanking && res.BookRanking.rankings) || [];

  const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const maxScore = Math.max(1, ...rows.map((b) => b.rankingScore || 0));

  $('rankList').innerHTML = rows.length
    ? rows.map((b) => {
        const medal = MEDALS[b.rank];
        const pct = Math.max(4, Math.round(((b.rankingScore || 0) / maxScore) * 100));
        return `
        <div class="rank-row${medal ? ` top top-${b.rank}` : ''}">
          ${medal
            ? `<div class="rank-medal">${medal}</div>`
            : `<div class="rank-number">${b.rank}</div>`}
          <div class="rank-main">
            <span class="rank-title">${esc(b.title)}</span>
            <span class="rank-author">${esc(b.author ?? '')}</span>
            <div class="rank-bar"><i style="width:${pct}%"></i></div>
            <p class="rank-stats">🏠 모임 ${b.roomCount ?? 0} · 👥 참여 ${b.totalRoomMemberCount ?? 0} · 💬 댓글 ${b.totalCommentCount ?? 0}</p>
          </div>
          <div class="rank-score">${b.rankingScore ?? 0}<small> 점</small></div>
        </div>`;
      }).join('')
    : '<p class="empty">아직 랭킹 데이터가 없어요. 모임을 만들고 댓글을 남기면 점수가 쌓여요!</p>';
}

$('rankPeriod').addEventListener('change', loadRanking);
$('btnRankRefresh').addEventListener('click', loadRanking);

// ==================== 시작 ====================
// 상단 네비(/home#reports 등)로 진입·이동해도 탭이 따라가도록
function routeFromHash() {
  const h = location.hash.replace('#', '');
  const roomMatch = h.match(/^room-(.+)$/);
  if (roomMatch) {
    openRoomPage(roomMatch[1]);
    return;
  }
  showTab(TABS.includes(h) ? h : 'home');
}

window.addEventListener('hashchange', routeFromHash);
routeFromHash();
