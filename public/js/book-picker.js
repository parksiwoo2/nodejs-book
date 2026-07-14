/**
 * 책 검색/선택 공용 위젯
 * 흐름: 네이버 검색(GET /api/book/search) → 결과 클릭으로 선택 → 제출 시 confirm()이
 *       POST /api/book으로 등록하고 Book 문서(_id 포함)를 돌려준다.
 *
 * 사용법 (layout.js 다음에 로드):
 *   const picker = kulug.createBookPicker(document.getElementById('mountEl'));
 *   // 폼 제출 시:
 *   const book = await picker.confirm(); // 미선택이면 안내 alert 후 null
 *   if (book) { ...book._id 사용... }
 */
(function () {
  const { api, esc } = window.kulug;

  function createBookPicker(mount) {
    let selected = null; // { title, author } — 아직 DB 등록 전 후보
    let page = 1;

    mount.classList.add('book-picker');
    mount.innerHTML = `
      <div class="bp-search toolbar" style="margin:0">
        <input type="text" class="bp-input" placeholder="책 제목이나 저자로 검색" style="flex:1;min-width:180px">
        <button type="button" class="btn-sm bp-btn">🔍 검색</button>
      </div>
      <div class="bp-results"></div>
      <div class="bp-selected" style="display:none">
        <span class="bp-selected-label"></span>
        <button type="button" class="btn-sm btn-ghost bp-clear">다시 선택</button>
      </div>`;

    const input = mount.querySelector('.bp-input');
    const searchBar = mount.querySelector('.bp-search');
    const resultsEl = mount.querySelector('.bp-results');
    const selectedEl = mount.querySelector('.bp-selected');
    const selectedLabel = mount.querySelector('.bp-selected-label');

    async function search(p) {
      const q = input.value.trim();
      if (!q) {
        alert('검색어를 입력해주세요.');
        return;
      }
      page = p;
      resultsEl.innerHTML = '<p class="empty">검색 중...</p>';
      const data = await api(`/book/search?q=${encodeURIComponent(q)}&page=${p}`);
      if (!data) {
        resultsEl.innerHTML = '';
        return;
      }
      render(data);
    }

    function render(data) {
      // 네이버 API는 start 최대 1000 → 100페이지까지만
      const lastPage = Math.max(1, Math.ceil(Math.min(data.total, 1000) / 10));

      resultsEl.innerHTML = data.items.length
        ? data.items.map((b, i) => `
            <div class="bp-item" data-i="${i}">
              ${b.thumbnail
                ? `<img src="${esc(b.thumbnail)}" alt="" loading="lazy">`
                : '<div class="bp-noimg">📕</div>'}
              <div class="bp-item-info">
                <strong>${esc(b.title)}</strong>
                <p class="meta">${esc(b.author) || '저자 미상'}${b.publisher ? ` · ${esc(b.publisher)}` : ''}</p>
              </div>
            </div>`).join('') +
          `<div class="toolbar bp-pager" style="margin:8px 0 0">
            <button type="button" class="btn-sm btn-ghost bp-prev" ${page <= 1 ? 'disabled' : ''}>◀</button>
            <span class="meta">${page} / ${lastPage} (총 ${data.total.toLocaleString()}권)</span>
            <button type="button" class="btn-sm btn-ghost bp-next" ${page >= lastPage ? 'disabled' : ''}>▶</button>
          </div>`
        : '<p class="empty">검색 결과가 없어요.</p>';

      resultsEl.querySelectorAll('.bp-item').forEach((el) => {
        el.addEventListener('click', () => select(data.items[el.dataset.i]));
      });
      const prev = resultsEl.querySelector('.bp-prev');
      const next = resultsEl.querySelector('.bp-next');
      if (prev) prev.addEventListener('click', () => search(page - 1));
      if (next) next.addEventListener('click', () => search(page + 1));
    }

    function select(b) {
      selected = { title: b.title, author: b.author };
      selectedLabel.innerHTML =
        `📖 <strong>${esc(b.title)}</strong> <span class="meta">${esc(b.author)}</span>`;
      searchBar.style.display = 'none';
      resultsEl.style.display = 'none';
      selectedEl.style.display = 'flex';
    }

    function clear() {
      selected = null;
      selectedEl.style.display = 'none';
      searchBar.style.display = 'flex';
      resultsEl.style.display = 'block';
      resultsEl.innerHTML = '';
      input.value = '';
    }

    // Enter로 검색 (감싸는 폼의 submit 방지)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        search(1);
      }
    });
    mount.querySelector('.bp-btn').addEventListener('click', () => search(1));
    mount.querySelector('.bp-clear').addEventListener('click', clear);

    return {
      /** 선택한 책을 DB에 등록(title+author 중복이면 기존 반환)하고 Book 문서 반환 */
      async confirm() {
        if (!selected) {
          alert('책을 검색해서 선택해주세요.');
          return null;
        }
        return api('/book', { method: 'POST', body: JSON.stringify(selected) });
      },
      clear,
      get selected() { return selected; }
    };
  }

  window.kulug.createBookPicker = createBookPicker;
})();
