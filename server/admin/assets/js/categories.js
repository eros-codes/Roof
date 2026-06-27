import * as api from './api.js';
import { state } from './state.js';
import { mkBtn, emptyState, escapeHtml } from './helpers.js';
import { openModal, toast, confirm } from './ui.js';

export async function loadCategories() {
  state.categories = await api.categories.getAll();
}

export function catFields() {
  return [
    { name: 'name', label: 'نام دسته‌بندی', placeholder: 'مثال: قهوه' },
    { name: 'type', label: 'نوع', type: 'select', options: [
      { value: 'cafe', label: 'کافه' },
      { value: 'restaurant', label: 'رستوران' },
      { value: 'breakfast', label: 'صبحانه' },
    ]},
  ];
}

export function renderCategories() {
  const el = document.getElementById('section-categories');
  el.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'section-header';
  // show filtered count in header
  const filteredCount = state.categoryFilter === 'all' ? state.categories.length : state.categories.filter(c => c.type === state.categoryFilter).length;
  header.innerHTML = `<div><h1 class="section-title">دسته‌بندی‌ها</h1><p class="section-sub">${filteredCount} دسته</p></div>`;
  const addBtn = mkBtn('دسته جدید', 'btn--accent'); addBtn.onclick = () => addCategory(); header.appendChild(addBtn); el.appendChild(header);
  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  tabs.style.marginBottom = '1rem';
  [['all', 'همه'], ['cafe', 'کافه'], ['restaurant', 'رستوران'], ['breakfast', 'صبحانه']].forEach(([val, label]) => {
    const btn = document.createElement('button');
    btn.className = `tab${state.categoryFilter === val ? ' active' : ''}`;
    btn.textContent = label;
    btn.onclick = () => { state.categoryFilter = val; renderCategories(); };
    tabs.appendChild(btn);
  });
  el.appendChild(tabs);

  if (state.categories.length === 0) { el.appendChild(emptyState('دسته‌بندی پیدا نشد', 'هنوز دسته‌ای ایجاد نشده')); return; }
  const list = document.createElement('div'); list.className = 'categories-list';
  const listItems = state.categoryFilter === 'all' ? state.categories : state.categories.filter(c => c.type === state.categoryFilter);
  listItems.forEach((c) => {
    const count = state.products.filter(p => p.categoryId === c.id).length;
    const row = document.createElement('div'); row.className = 'category-row';
    row.innerHTML = `\n      <div class="category-info">\n        <span class="badge badge--${c.type}">${escapeHtml(c.type)}</span>\n        <span class="category-name">${escapeHtml(c.name)}</span>\n        <span style="color:var(--quaternary-text-color);font-size:.75rem">${count} محصول</span>\n      </div>\n      <div class="category-actions"></div>`;
    const actions = row.querySelector('.category-actions');
    const editBtn = mkBtn('ویرایش', 'btn--ghost btn--sm'); editBtn.onclick = () => editCategory(c); actions.appendChild(editBtn);
    const delBtn = mkBtn('حذف', 'btn--danger btn--sm'); delBtn.onclick = () => deleteCategory(c.id, count); actions.appendChild(delBtn);
    list.appendChild(row);
  });
  el.appendChild(list);
}

export function addCategory() {
  openModal({ title: 'دسته‌بندی جدید', fields: catFields(), submitText: 'افزودن', onSubmit: async (data) => {
    const createdCategory = await api.categories.create(data);
    state.categories.push(createdCategory);
    toast('دسته‌بندی اضافه شد', 'success');
    renderCategories();
  }});
}

export function editCategory(c) {
  openModal({ title: 'ویرایش دسته‌بندی', fields: catFields(), initialValues: c, submitText: 'ذخیره', onSubmit: async (data) => {
    const updatedCategory = await api.categories.update(c.id, data);
    state.categories = state.categories.map((item) => (item.id === c.id ? updatedCategory : item));
    toast('دسته‌بندی ویرایش شد', 'success');
    renderCategories();
  }});
}

export async function deleteCategory(id, count) {
  if (count > 0) {
    const ok = await confirm(`این دسته‌بندی ${count} محصول دارد. با حذف آن ممکن است محصولات بدون دسته بمانند. ادامه می‌دهید؟`, 'حذف دسته‌بندی');
    if (!ok) return;
  } else {
    const ok = await confirm('این دسته‌بندی حذف می‌شود. مطمئنید؟', 'حذف دسته‌بندی'); if (!ok) return;
  }
  try {
    await api.categories.delete(id);
    state.categories = state.categories.filter((item) => item.id !== id);
    toast('دسته‌بندی حذف شد', 'success');
    renderCategories();
  } catch (e) {
    toast(e.message, 'error');
  }
}
