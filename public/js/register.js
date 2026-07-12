const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nickname = document.getElementById('nickname').value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  registerMessage.textContent = '';

  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, username, password })
    });

    const result = await response.json();

    if (result.success) {
      registerMessage.className = 'message success';
      registerMessage.textContent = 'Registration complete. Redirecting to login...';
      window.location.href = '/login';
      return;
    }

    registerMessage.className = 'message error';
    registerMessage.textContent = result.message || 'Registration failed.';
  } catch (error) {
    registerMessage.className = 'message error';
    registerMessage.textContent = 'Could not connect to the server.';
  }
});
