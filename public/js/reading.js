let timerInterval;
let seconds = 0;
let isRunning = false;

const timeDisplay = document.getElementById('time');
const timerCircle = document.querySelector('.timer-circle');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const saveBtn = document.getElementById('saveBtn');
const statusMessage = document.getElementById('statusMessage');

const bookIdInput = document.getElementById('bookId');

const bgm = new Audio('/audio/rain.m4a');
bgm.loop = true;
bgm.volume = 0.5;

function playBgm() {
  const playPromise = bgm.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch((err) => {
      console.warn('BGM play failed:', err);
    });
  }
}

function pauseBgm() {
  bgm.pause();
}

function stopBgm() {
  bgm.pause();
  bgm.currentTime = 0;
}

function getAuthHeader() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

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

  playBgm();

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
  pauseBgm();
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  startBtn.textContent = '계속';
});

saveBtn.addEventListener('click', async () => {
  isRunning = false;
  clearInterval(timerInterval);
  timerCircle.classList.remove('active');
  pauseBgm();

  const readingTime = seconds;
  const bookId = bookIdInput.value.trim();
  const authorization = getAuthHeader();

  if (!authorization) {
    showStatus('로그인이 필요합니다.', true);
    return;
  }

  if (readingTime === 0) {
    showStatus('독서 시간이 0초입니다.', true);
    return;
  }

  if (!bookId) {
    showStatus('Book ID를 입력해주세요.', true);
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
        'Content-Type': 'application/json',
        Authorization: authorization
      },
      body: JSON.stringify({
        bookId,
        readingTime
      })
    });

    const data = await response.json();

    if (response.ok) {
      showStatus('성공적으로 저장되었습니다!');
      seconds = 0;
      updateDisplay();
      stopBgm();
      startBtn.textContent = '시작';
      startBtn.disabled = false;
      saveBtn.textContent = '기록 저장';
    } else if (response.status === 401) {
      showStatus('로그인이 만료되었거나 유효하지 않습니다. 다시 로그인해 주세요.', true);
      saveBtn.textContent = '기록 저장';
      saveBtn.disabled = false;
    } else {
      showStatus(`오류: ${data.error || data.message || '저장에 실패했습니다.'}`, true);
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
  statusMessage.style.color = isError ? '#e11d48' : '#059669';
  statusMessage.classList.add('show');
}
