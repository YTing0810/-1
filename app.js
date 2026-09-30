// 待辦清單使用瀏覽器本機儲存,不需要網路或外部套件。

const STORAGE_KEY = 'daily-todos';
const THEME_KEY = 'daily-todos-theme';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');
const clearCompletedButton = document.getElementById('clear-completed');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');
const filterButtons = [...document.querySelectorAll('.filter-button')];

let todos = loadTodos();
let currentFilter = 'all';
let themePreference = loadThemePreference();
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

// 套用主題並同步切換按鈕的圖示與文字。
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeLabel.textContent = theme === 'dark' ? '淺色模式' : '深色模式';
  themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
}

// 讀取使用者手動選擇的主題,沒有有效設定時交由系統決定。
function loadThemePreference() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch (error) {
    console.warn('讀取主題設定失敗,將跟隨作業系統設定。', error);
    return null;
  }
}

applyTheme(themePreference || (systemTheme.matches ? 'dark' : 'light'));

systemTheme.addEventListener('change', (event) => {
  if (!themePreference) applyTheme(event.matches ? 'dark' : 'light');
});

themeToggle.addEventListener('click', () => {
  themePreference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(themePreference);

  try {
    localStorage.setItem(THEME_KEY, themePreference);
  } catch (error) {
    console.warn('儲存主題設定失敗。', error);
  }
});

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

  const visibleTodos = todos.filter((todo) => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });

  visibleTodos.forEach((todo) => {
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

  emptyState.hidden = visibleTodos.length > 0;
  if (todos.length === 0) {
    emptyState.textContent = '還沒有任何待辦事項,新增一個吧!';
  } else if (currentFilter === 'active') {
    emptyState.textContent = '目前沒有未完成的待辦事項。';
  } else if (currentFilter === 'completed') {
    emptyState.textContent = '目前沒有已完成的待辦事項。';
  }

  filterButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === currentFilter));
  });

  const completedCount = todos.filter((todo) => todo.completed).length;
  clearCompletedButton.disabled = completedCount === 0;
  remainingCount.textContent = `未完成:${todos.length - completedCount} 項`;
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

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    render();
  });
});

clearCompletedButton.addEventListener('click', () => {
  if (!todos.some((todo) => todo.completed)) return;
  if (!window.confirm('確定要清除所有已完成的待辦事項嗎？')) return;

  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
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