// 페이지가 로드되면 전체 방 목록을 먼저 불러옵니다.
document.addEventListener("DOMContentLoaded", () => {
    fetchRoomList();
});

// 1. 백엔드로부터 전체 방 목록을 가져와서 화면에 그려주는 함수
async function fetchRoomList() {
    try {
        const response = await fetch('/api/rooms/list');
        const rooms = await response.json();

        const container = document.getElementById('roomListContainer');
        container.innerHTML = ''; // 기존 목록 초기화

        if (rooms.length === 0) {
            container.innerHTML = '<p>개설된 방이 없습니다. 첫 번째 방을 만들어보세요!</p>';
            return;
        }

        // 방 목록을 돌면서 화면에 카드와 가입 버튼을 만들어 붙입니다.
        rooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card';
            roomCard.innerHTML = `
                <h3>${room.title}</h3>
                <p>참여 인원: ${room.members.length}명</p>
                <!-- 가입 버튼 클릭 시 방의 ID를 인자로 넘겨줍니다 -->
                <button onclick="handleJoinRoom('${room._id}')">가입하기</button>
            `;
            container.appendChild(roomCard);
        });
    } catch (error) {
        console.error("방 목록을 불러오는 중 오류 발생:", error);
    }
}

// 2. 가입 버튼을 눌렀을 때 실행되는 함수
async function handleJoinRoom(roomId) {
    // 팝업창(prompt) 없이 바로 백엔드에 가입 요청을 때립니다!
    try {
        const response = await fetch(`/api/rooms/${roomId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 만약 로그인 토큰(JWT)을 로컬스토리지에 저장해 쓴다면 아래 주석 해지
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            alert("방 가입에 성공했습니다! 바로 입장합니다.");
            // 가입 성공 시 상세 채팅방 화면(예: 상세 페이지)으로 이동
            window.location.href = `/room-detail.html?id=${roomId}`; 
        } else {
            // 백엔드에서 던진 에러 메시지("이미 가입된 방입니다" 등)를 그대로 띄워줍니다.
            alert(`가입 실패: ${result.message}`);
        }
    } catch (error) {
        console.error("서버 통신 에러:", error);
        alert("서버 연결에 실패했습니다.");
    }
}