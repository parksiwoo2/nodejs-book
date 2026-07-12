const periodSelect = document.getElementById('period');
const loadRankingBtn = document.getElementById('loadRankingBtn');
const rankingTableBody = document.getElementById('rankingTableBody');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');

async function loadBookRanking() {
  const period = periodSelect.value;
  const page = 1;
  const limit = 10;

  loading.style.display = 'block';
  errorMessage.textContent = '';
  rankingTableBody.innerHTML = '';

  try {
    const response = await fetch(
      `/api/book-ranking?period=${period}&page=${page}&limit=${limit}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Book Ranking 조회에 실패했습니다.');
    }

    const rankings = data.BookRanking.rankings;

    if (rankings.length === 0) {
      rankingTableBody.innerHTML = `
        <tr>
          <td colspan="7">랭킹 데이터가 없습니다.</td>
        </tr>
      `;
      return;
    }

    rankings.forEach((book) => {
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${book.rank}</td>
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.roomCount}</td>
        <td>${book.totalRoomMemberCount}</td>
        <td>${book.totalCommentCount}</td>
        <td>${book.rankingScore}</td>
      `;

      rankingTableBody.appendChild(row);
    });
  } catch (error) {
    errorMessage.textContent = error.message;
  } finally {
    loading.style.display = 'none';
  }
}

loadRankingBtn.addEventListener('click', loadBookRanking);

window.addEventListener('DOMContentLoaded', loadBookRanking);