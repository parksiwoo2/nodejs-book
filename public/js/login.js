const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const result = await response.json();

  if (result.success) {
    const token = result.token;
    localStorage.setItem('token', token);
    alert('로그인 성공!');
    window.location.href = '/';
  } else {
    alert('로그인 실패: ' + result.message);
  }
});