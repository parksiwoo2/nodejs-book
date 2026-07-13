document.addEventListener('DOMContentLoaded', () => {
  const btnRecent = document.getElementById('btn-recent');
  const btnByBook = document.getElementById('btn-by-book');
  const tabRecent = document.getElementById('tab-recent');
  const tabByBook = document.getElementById('tab-by-book');

  // 초기 탭 상태 설정
  tabRecent.style.display = 'block';
  tabByBook.style.display = 'none';

  // 탭 전환 로직
  const switchTab = (tabId) => {
    document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));

    if (tabId === 'recent') {
      btnRecent.classList.add('active');
      tabRecent.style.display = 'block';
      tabByBook.style.display = 'none';
    } else {
      btnByBook.classList.add('active');
      tabRecent.style.display = 'none';
      tabByBook.style.display = 'block';
    }
  };

  btnRecent.addEventListener('click', () => switchTab('recent'));
  btnByBook.addEventListener('click', () => switchTab('by-book'));

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };

    if (token) {
      headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    return headers;
  };

  // 초 단위를 텍스트로 포맷팅
  const formatTimeText = (totalSeconds) => {
    if (!totalSeconds || totalSeconds === 0) return '0초';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);

    const parts = [];
    if (h > 0) parts.push(`${h}시간`);
    if (m > 0) parts.push(`${m}분`);
    if (s > 0) parts.push(`${s}초`);

    return parts.join(' ');
  };

  // /api/readinglog 에서 데이터 가져오기 및 렌더링
  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/readinglog', {
        headers: getAuthHeaders()
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || '데이터를 불러올 수 없습니다.');
      }

      renderDashboard(result.data);
    } catch (error) {
      console.error(error);
      document.getElementById('recent-loading').textContent =
        error.message || '데이터를 불러올 수 없습니다.';
    }
  };

  const renderDashboard = (data) => {
    const totalSeconds = data.totalReadingTime || 0;
    document.getElementById('totalTimeDisplay').textContent = formatTimeText(totalSeconds);

    const logs = data.readinglog || [];

    document.getElementById('recent-loading').style.display = 'none';
    const recentList = document.getElementById('recent-list');
    const byBookList = document.getElementById('by-book-list');
    recentList.style.display = 'block';

    if (logs.length === 0) {
      recentList.innerHTML =
        '<li class="list-item"><div class="book-title">독서 기록이 없습니다.</div></li>';
      byBookList.innerHTML =
        '<li class="list-item"><div class="book-title">독서 기록이 없습니다.</div></li>';
      return;
    }

    // 최근 독서 기록 (최신순)
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.readDt) - new Date(a.readDt)
    );

    recentList.innerHTML = sortedLogs
      .map((log) => {
        const dateStr = new Date(log.readDt).toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        return `
        <li class="list-item">
          <div class="book-title">${log.bookTitle || '이름 모를 책'}</div>
          <div class="history-meta">
            <span>측정: ${formatTimeText(log.readingTime)}</span>
            <span>${dateStr}</span>
          </div>
        </li>
      `;
      })
      .join('');

    // 책별 누적 시간 (bookId 기준 그룹화)
    const bookMap = {};
    logs.forEach((log) => {
      const bId = log.bookId;
      if (!bookMap[bId]) {
        bookMap[bId] = {
          title: log.bookTitle || '이름 모를 책',
          totalTime: 0
        };
      }
      bookMap[bId].totalTime += log.readingTime || 0;
    });

    const groupedLogs = Object.values(bookMap).sort(
      (a, b) => b.totalTime - a.totalTime
    );

    byBookList.innerHTML = groupedLogs
      .map(
        (b) => `
      <li class="list-item">
        <div class="book-title">${b.title}</div>
        <div class="history-meta">
          <span class="accent">총 누적: ${formatTimeText(b.totalTime)}</span>
        </div>
      </li>
    `
      )
      .join('');
  };

  loadDashboard();
});
