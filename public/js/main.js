document.addEventListener('DOMContentLoaded', fetchGuests);

const mainForm = document.getElementById('mainForm');
const mainList = document.getElementById('mainList');
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };

    if (token) {
      headers.Authorization = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
    }

    return headers;
  };
async function fetchGuests() {
  const response = await fetch('/api/main',{
    method: 'GET',
    headers: getAuthHeaders()
  });
  const result = await response.json();
  
  if (result.success) {
    mainList.innerHTML = '';
    
    result.data.forEach(item => {
      const div = document.createElement('div');
      div.className = 'guest-item';
      div.innerHTML = `<strong>${item.name}</strong>: ${item.content}`;
      mainList.appendChild(div);
    });
  }
}

mainForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const authorization = getAuthHeaders();
  const name = document.getElementById('name').value;
  const content = document.getElementById('content').value;

  const response = await fetch('/api/main', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, content })
  });

  const result = await response.json();

  if (result.success) {
    alert('방명록이 등록되었습니다!');
    mainForm.reset();
    fetchGuests();
  } else {
    alert('등록 실패: ' + result.message);
  }
});