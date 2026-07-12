document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token'); // 로그인 토큰 가져오기
    
    if (!token) {
        alert('로그인이 필요한 서비스입니다.');
        window.location.href = '/login.html'; // 로그인 페이지로 튕구기
        return;
    }

    fetchRooms();

    // 1. 방 목록 가져오기 함수
    async function fetchRooms() {
        try {
            // 아까 작업한 방 목록 API 주소 호출 (필요시 주소 규격에 맞게 수정 가능)
            const response = await fetch('/api/room', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // 실제 로그인된 토큰 전송
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();

            if (result.success) {
                renderRooms(result.rooms); // 응답에 들어있는 방 배열 렌더링
            } else {
                alert('방 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    }

    // 2. 화면에 방 목록 그려주기
    function renderRooms(rooms) {
        const container = document.getElementById('room-container');
        container.innerHTML = '';

        if (!rooms || rooms.length === 0) {
            container.innerHTML = '<p>개설된 독서 모임 방이 없습니다.</p>';
            return;
        }

        rooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card';
            
            // 회의하신 대로 초대코드가 필요한 방인지(isPrivate 등)에 따라 UI 분기 가능
            roomCard.innerHTML = `
                <div class="room-header">
                    <div>
                        <h3>${room.title}</h3>
                        <p>개설자: ${room.master.name} | 참여 인원: ${room.memberCount}명</p>
                        <p>선정 도서: ${room.book.title} (${room.book.author})</p>
                    </div>
                    <div>
                        <button class="btn join-btn" data-id="${room._id}">가입하기</button>
                    </div>
                </div>
                <input type="text" class="invite-input" id="invite-${room._id}" placeholder="초대코드를 입력하세요 (필요시)">
            `;
            container.appendChild(roomCard);
        });

        // 가입하기 버튼 이벤트 리스너 등록
        document.querySelectorAll('.join-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const roomId = e.target.getAttribute('data-id');
                const inviteInput = document.getElementById(`invite-${roomId}`);
                
                // 만약 첫 클릭이고 초대코드가 필요해 보인다면 입력을 받도록 노출
                // (일반 가입은 빈 값으로 바로 전송 가능하도록 오늘 백엔드를 전면 수정했죠!)
                const inviteCode = inviteInput.value.trim();

                await joinRoom(roomId, inviteCode, inviteInput);
            });
        });
    }

    async function joinRoom(roomId, inviteCode, inviteInput) {
        try {
            const response = await fetch(`/api/room/${roomId}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`, // 실제 로그인된 토큰 전송
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inviteCode: inviteCode || null }) // 초대코드가 없으면 빈 상태로 전송
            });

            const result = await response.json();

            if (response.status === 201 && result.success) {
                alert('방에 성공적으로 가입되었습니다!');
                // 팀원 규격 스펙 data.Room 구조에 맞춰서 다음 상세 페이지 이동 처리 가능
                window.location.href = `/room-detail.html?id=${result.data.Room._id}`;
            } else {
                // 백엔드에서 던진 에러 메시지(예: "잘못된 코드를 입력하셨습니다.") 출력
                alert(`가입 실패: ${result.error.message}`);
                
                // 만약 초대코드가 필요한 방이었다면 입력창을 슥 보여주기
                if (result.error.code === "INVITE_CODE_REQUIRED") {
                    inviteInput.style.display = 'block';
                    inviteInput.focus();
                }
            }
        } catch (error) {
            console.error('Error joining room:', error);
            alert('가입 처리 중 서버 오류가 발생했습니다.');
        }
    }
});