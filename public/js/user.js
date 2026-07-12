const userMessage = document.getElementById('userMessage');

const setMessage = (message, type = '') => {
  if (!userMessage) return;
  userMessage.className = type ? `message ${type}` : 'message';
  userMessage.textContent = message;
};

const getStoredToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return '';
  return token.startsWith('Bearer ') ? token.slice(7) : token;
};

const getUserIdFromToken = () => {
  const token = getStoredToken();
  if (!token) return '';

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || '';
  } catch (error) {
    return '';
  }
};

const getUserId = () => {
  return localStorage.getItem('userId') || getUserIdFromToken();
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };

  if (token) {
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  return headers;
};

const fetchUser = async () => {
  const userId = getUserId();

  if (!userId) {
    throw new Error('Login is required.');
  }

  const response = await fetch(`/api/users/me?id=${encodeURIComponent(userId)}`, {
    headers: getAuthHeaders()
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Could not load user.');
  }

  localStorage.setItem('userId', result.data._id);
  return result.data;
};

const renderMyPage = async () => {
  try {
    const user = await fetchUser();

    document.getElementById('mypageNickname').textContent = user.nickname || '-';
    document.getElementById('mypageUsername').textContent = user.username || '-';
    document.getElementById('mypageRole').textContent = user.role || '-';
    setMessage('');
  } catch (error) {
    setMessage(error.message, 'error');
  }
};

const fillEditForm = async () => {
  try {
    const user = await fetchUser();

    document.getElementById('nickname').value = user.nickname || '';
    document.getElementById('username').value = user.username || '';
    setMessage('');
  } catch (error) {
    setMessage(error.message, 'error');
  }
};

const bindEditForm = () => {
  const form = document.getElementById('userEditForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = getUserId();
    const nickname = document.getElementById('nickname').value.trim();
    const username = document.getElementById('username').value.trim();

    if (!id) {
      setMessage('Login is required.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id,
          updateData: { nickname, username }
        })
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Could not update user.');
      }

      setMessage('User info updated.', 'success');
    } catch (error) {
      setMessage(error.message, 'error');
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  if (page === 'mypage') {
    renderMyPage();
  }

  if (page === 'edit-user') {
    fillEditForm();
    bindEditForm();
  }
});
