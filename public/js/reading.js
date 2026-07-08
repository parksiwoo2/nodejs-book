let timerInterval;
let seconds = 0;
let isRunning = false;

const timeDisplay = document.getElementById('time');
const timerCircle = document.querySelector('.timer-circle');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const saveBtn = document.getElementById('saveBtn');
const statusMessage = document.getElementById('statusMessage');

const userIdInput = document.getElementById('userId');
const bookIdInput = document.getElementById('bookId');
const bookTitleInput = document.getElementById('bookTitle');

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(seconds);
}

startBtn.addEventListener('click', () => {
  if (isRunning) return;
  isRunning = true;
  timerCircle.classList.add('active');
  
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  saveBtn.disabled = false;
  statusMessage.classList.remove('show');

  timerInterval = setInterval(() => {
    seconds++;
    updateDisplay();
  }, 1000);
});

pauseBtn.addEventListener('click', () => {
  if (!isRunning) return;
  isRunning = false;
  timerCircle.classList.remove('active');
  
  clearInterval(timerInterval);
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  startBtn.textContent = '계속';
});

saveBtn.addEventListener('click', async () => {
  isRunning = false;
  clearInterval(timerInterval);
  timerCircle.classList.remove('active');
  
  const readingTime = seconds; 
  const userId = userIdInput.value.trim();
  const bookId = bookIdInput.value.trim();
  const bookTitle = bookTitleInput.value.trim();

  if(readingTime === 0) {
    showStatus('독서 시간이 0초입니다.', true);
    return;
  }
  
  if(!userId || !bookId) {
    showStatus('User ID와 Book ID를 입력해주세요.', true);
    return;
  }

  startBtn.disabled = true;
  pauseBtn.disabled = true;
  saveBtn.disabled = true;
  saveBtn.textContent = '저장 중...';

  try {
    const response = await fetch('/api/reading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        bookId,
        bookTitle,
        readingTime 
      })
    });

    const data = await response.json();

    if (response.ok) {
      showStatus('성공적으로 저장되었습니다!');
      seconds = 0;
      updateDisplay();
      startBtn.textContent = '시작';
      startBtn.disabled = false;
      saveBtn.textContent = '기록 저장';
    } else {
      showStatus(`오류: ${data.error}`, true);
      saveBtn.textContent = '기록 저장';
      saveBtn.disabled = false;
    }
  } catch (error) {
    showStatus('네트워크 오류가 발생했습니다.', true);
    saveBtn.textContent = '기록 저장';
    saveBtn.disabled = false;
  }
});

function showStatus(msg, isError = false) {
  statusMessage.textContent = msg;
  // 기존 다크모드 색상 대신 style.css 테마에 어울리는 색상 사용
  statusMessage.style.color = isError ? '#e11d48' : '#059669'; 
  statusMessage.classList.add('show');
}
