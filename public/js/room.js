function getAuthHeader() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

// 페이지가 로드되면 전체 방 목록을 먼저 불러옵니다.
document.addEventListener('DOMContentLoaded', () => {
    fetchRoomList();
});

// 1. 백엔드로부터 전체 방 목록을 가져와서 화면에 그려주는 함수
async function fetchRoomList() {
    const container = document.getElementById('roomListContainer');
    if (!container) {
        console.error('roomListContainer 요소를 찾을 수 없습니다.');
        return;
    }

    const authorization = getAuthHeader();
    if (!authorization) {
        container.innerHTML = '<p>로그인이 필요합니다. <a href="/login">로그인</a> 후 이용해주세요.</p>';
        return;
    }

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
            container.innerHTML = '<p>로그인이 만료되었습니다. <a href="/login">다시 로그인</a>해주세요.</p>';
            return;
        }

        if (!response.ok || !result.success) {
            const message = result.error?.message || result.message || '방 목록을 불러오지 못했습니다.';
            container.innerHTML = `<p>${message}</p>`;
            return;
        }

        const rooms = Array.isArray(result.rooms) ? result.rooms : [];
        container.innerHTML = '';

        if (rooms.length === 0) {
            container.innerHTML = '<p>개설된 방이 없습니다. 첫 번째 방을 만들어보세요!</p>';
            return;
        }

        rooms.forEach((room) => {
            const memberCount =
                room.memberCount ??
                (Array.isArray(room.members) ? room.members.length : 0);
            const masterName = room.master?.name || '-';
            const bookTitle = room.book?.title || '-';
            const bookAuthor = room.book?.author ? ` (${room.book.author})` : '';

            const roomCard = document.createElement('div');
            roomCard.className = 'room-card';
            roomCard.innerHTML = `
                <div class="room-header">
                    <div>
                        <h3>${room.title}</h3>
                        <p>개설자: ${masterName} | 참여 인원: ${memberCount}명</p>
                        <p>선정 도서: ${bookTitle}${bookAuthor}</p>
                    </div>
                    <div>
                        <button class="btn join-btn" type="button" data-id="${room._id}">가입하기</button>
                    </div>
                </div>
            `;
            container.appendChild(roomCard);
        });

        container.querySelectorAll('.join-btn').forEach((button) => {
            button.addEventListener('click', () => {
                handleJoinRoom(button.getAttribute('data-id'));
            });
        });
    } catch (error) {
        console.error('방 목록을 불러오는 중 오류 발생:', error);
        container.innerHTML = '<p>서버 연결에 실패했습니다.</p>';
    }
}

// 2. 가입 버튼을 눌렀을 때 실행되는 함수
async function handleJoinRoom(roomId) {
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
            // 상세 페이지가 아직 없으므로 목록을 새로고침해 인원 수 반영
            await fetchRoomList();
        } else {
            alert(`가입 실패: ${result.error?.message || result.message || '알 수 없는 오류'}`);
        }
    } catch (error) {
        console.error('서버 통신 에러:', error);
        alert('서버 연결에 실패했습니다.');
    }
}
