const API_URL = 'https://server2.inf.uct.cl';

const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');

async function loadTasks() {
  const res = await fetch(`${API_URL}/tasks`);
  const tasks = await res.json();
  list.innerHTML = '';
  for (const task of tasks) {
    const li = document.createElement('li');
    li.textContent = task.title;
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    li.appendChild(deleteBtn);
    list.appendChild(li);
  }
}

async function addTask(title) {
  await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  await loadTasks();
}

async function deleteTask(id) {
  await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
  await loadTasks();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  input.value = '';
  addTask(title);
});

loadTasks().catch((err) => {
  console.error('No se pudo conectar con el backend:', err);
});
