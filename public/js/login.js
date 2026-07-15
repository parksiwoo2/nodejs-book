const loginForm = document.getElementById('loginForm');
const logoutPanel = document.getElementById('logoutPanel');
const logoutButton = document.getElementById('logoutButton');
const loginMessage = document.getElementById('loginMessage');
const logoutMessage = document.getElementById('logoutMessage');
const loginPanelTitle = document.getElementById('loginPanelTitle');

const hasToken = () => Boolean(localStorage.getItem('token'));

const setLoginState = () => {
  const loggedIn = hasToken();

  loginForm.hidden = loggedIn;
  logoutPanel.hidden = !loggedIn;
  loginPanelTitle.textContent = loggedIn ? '로그아웃' : '로그인';
};

const showMessage = (element, message, type = '') => {
  element.className = type ? `message ${type}` : 'message';
  element.textContent = message;
};

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  showMessage(loginMessage, '');

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (!result.success) {
      showMessage(loginMessage, result.message || '로그인에 실패했습니다.', 'error');
      return;
    }

    localStorage.setItem('token', result.data.token);

    showMessage(loginMessage, '로그인되었습니다.', 'success');
    window.location.href = '/'; // 로그인 후 통합 페이지로
  } catch (error) {
    showMessage(loginMessage, '서버에 연결할 수 없습니다.', 'error');
  }
});

logoutButton.addEventListener('click', () => {
  localStorage.removeItem('token');
  showMessage(logoutMessage, '로그아웃되었습니다.', 'success');
  setLoginState();
});

setLoginState();
