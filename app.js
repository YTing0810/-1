// 待辦清單使用瀏覽器本機儲存,不需要網路或外部套件。

const STORAGE_KEY = 'daily-todos';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');

let todos = loadTodos();

// 從本機儲存讀取清單,遇到無效資料時以空清單開始。
function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed)
      ? parsed.filter((todo) => todo && typeof todo.id === 'string' && typeof todo.text === 'string')
        .map((todo) => ({ ...todo, completed: Boolean(todo.completed) }))
      : [];
  } catch (error) {
    console.warn('讀取待辦清單失敗,將以空清單開始。', error);
    return [];
  }
}

// 將目前清單寫入本機儲存。
function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.warn('儲存待辦清單失敗。', error);
  }
}

// 根據資料更新清單、空狀態與未完成數量。
function render() {
  list.replaceChildren();

  todos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = todo.completed ? 'todo-item completed' : 'todo-item';
    item.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `標記「${todo.text}」為完成`);

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn-delete';
    deleteButton.textContent = '×';
    deleteButton.setAttribute('aria-label', `刪除「${todo.text}」`);

    item.append(checkbox, text, deleteButton);
    list.append(item);
  });

  emptyState.hidden = todos.length > 0;
  remainingCount.textContent = `未完成:${todos.filter((todo) => !todo.completed).length} 項`;
}

// 新增一筆未完成事項。
function addTodo(text) {
  todos.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    completed: false,
  });
  saveTodos();
  render();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  addTodo(text);
  input.value = '';
  input.focus();
});

// 以事件委派處理完成狀態切換與刪除。
list.addEventListener('click', (event) => {
  const item = event.target.closest('.todo-item');
  if (!item) return;

  if (event.target.matches('input[type="checkbox"]')) {
    todos = todos.map((todo) =>
      todo.id === item.dataset.id ? { ...todo, completed: event.target.checked } : todo
    );
  } else if (event.target.matches('.btn-delete')) {
    todos = todos.filter((todo) => todo.id !== item.dataset.id);
  } else {
    return;
  }

  saveTodos();
  render();
});

render();