/**
 * 공통 레이어 — 통합 페이지 계열에서 <body> 최상단에 로드
 * 1) 상단 네비게이션 주입 (현재 페이지 하이라이트)
 * 2) 로그인 상태 표시 (마이페이지/로그아웃 ↔ 로그인 버튼)
 * 3) 공통 헬퍼: kulug.api() 인증 fetch, kulug.esc() XSS 방어
 */
(function () {
  const token = localStorage.getItem('token');
  const loggedIn = !!token && token !== 'undefined';

  // JWT payload에서 내 유저 id 추출 (UI 용도 — 진짜 검증은 서버가 함)
  let myUserId = null;
  if (loggedIn) {
    try {
      const raw = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      myUserId = JSON.parse(atob(raw.split('.')[1])).id;
    } catch (e) { /* 손상된 토큰이면 무시 */ }
  }

  // ---------- 네비게이션 주입 ----------
  const MENU = [
    { href: '/home', label: '홈' },
    { href: '/home#reports', label: '독후감' },
    { href: '/home#rooms', label: '독서 모임' },
    { href: '/home#time', label: '독서 시간' },
    { href: '/home#rank', label: '랭킹' }
  ];

  const path = location.pathname;
  const links = MENU.map((m) => {
    const base = m.href.split('#')[0];
    const active = path === base && m.href === '/home' ? ' active' : '';
    return `<a class="nav-link${active}" href="${m.href}">${m.label}</a>`;
  }).join('');

  const authArea = loggedIn
    ? `<a class="nav-link" href="/mypage">마이페이지</a>
       <button class="btn-sm btn-ghost" id="navLogout">로그아웃</button>`
    : `<a class="nav-link" href="/login">로그인</a>`;

  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  nav.innerHTML = `
    <div class="nav-inner">
      <a class="brand" href="/home">📖 독서<span>기록장</span></a>
      ${links}
      <span class="nav-spacer"></span>
      ${authArea}
    </div>`;
  document.body.prepend(nav);

  const logoutBtn = document.getElementById('navLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      location.href = '/login';
    });
  }

  // ---------- 공통 헬퍼 ----------
  function esc(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
  }

  function authHeader() {
    if (!loggedIn) return null;
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  /**
   * 인증 포함 fetch. 팀 공통 에러 envelope 처리.
   * 성공 시 data 반환, 실패 시 alert 후 null.
   */
  async function api(apiPath, options = {}) {
    const res = await fetch('/api' + apiPath, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(loggedIn && { Authorization: authHeader() }),
        ...options.headers
      }
    });
    if (res.status === 401) {
      alert('로그인이 필요합니다.');
      location.href = '/login';
      return null;
    }
    const body = await res.json().catch(() => null);
    if (!body || body.success === false) {
      const msg = body && body.error ? body.error.message : (body && body.message) || '요청에 실패했습니다.';
      alert(msg);
      return null;
    }
    return body.data !== undefined ? body.data : body;
  }

  // 로그인 필수 페이지에서 호출: 미로그인 시 로그인으로 보냄
  function requireLogin() {
    if (!loggedIn) {
      alert('로그인이 필요합니다.');
      location.href = '/login';
      return false;
    }
    return true;
  }

  window.kulug = { api, esc, requireLogin, loggedIn, myUserId, token };
})();
