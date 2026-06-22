import * as api from './api.js';
import { state } from './state.js';
import { mkBtn, emptyState } from './helpers.js';
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
  header.innerHTML = `<div><h1 class="section-title">دسته‌بندی‌ها</h1><p class="section-sub">${state.categories.length} دسته</p></div>`;
  const addBtn = mkBtn('دسته جدید', 'btn--accent'); addBtn.onclick = () => addCategory(); header.appendChild(addBtn); el.appendChild(header);
  if (state.categories.length === 0) { el.appendChild(emptyState('دسته‌بندی پیدا نشد', 'هنوز دسته‌ای ایجاد نشده')); return; }
  const list = document.createElement('div'); list.className = 'categories-list';
  state.categories.forEach((c) => {
    const count = state.products.filter(p => p.categoryId === c.id).length;
    const row = document.createElement('div'); row.className = 'category-row';
    row.innerHTML = `\n      <div class="category-info">\n        <span class="badge badge--${c.type}">${c.type}</span>\n        <span class="category-name">${c.name}</span>\n        <span style="color:var(--quaternary-text-color);font-size:.75rem">${count} محصول</span>\n      </div>\n      <div class="category-actions"></div>`;
    const actions = row.querySelector('.category-actions');
    const editBtn = mkBtn('ویرایش', 'btn--ghost btn--sm'); editBtn.onclick = () => editCategory(c); actions.appendChild(editBtn);
    const delBtn = mkBtn('حذف', 'btn--danger btn--sm'); delBtn.onclick = () => deleteCategory(c.id, count); actions.appendChild(delBtn);
    list.appendChild(row);
  });
  el.appendChild(list);
}

export function addCategory() {
  openModal({ title: 'دسته‌بندی جدید', fields: catFields(), submitText: 'افزودن', onSubmit: async (data) => {
    await api.categories.create(data); toast('دسته‌بندی اضافه شد', 'success'); [state.categories, state.products] = await Promise.all([api.categories.getAll(), api.products.getAll()]); renderCategories();
  }});
}

export function editCategory(c) {
  openModal({ title: 'ویرایش دسته‌بندی', fields: catFields(), initialValues: c, submitText: 'ذخیره', onSubmit: async (data) => {
    await api.categories.update(c.id, data); toast('دسته‌بندی ویرایش شد', 'success'); [state.categories, state.products] = await Promise.all([api.categories.getAll(), api.products.getAll()]); renderCategories();
  }});
}

export async function deleteCategory(id, count) {
  if (count > 0) {
    const ok = await confirm(`این دسته‌بندی ${count} محصول دارد. با حذف آن ممکن است محصولات بدون دسته بمانند. ادامه می‌دهید؟`, 'حذف دسته‌بندی');
    if (!ok) return;
  } else {
    const ok = await confirm('این دسته‌بندی حذف می‌شود. مطمئنید؟', 'حذف دسته‌بندی'); if (!ok) return;
  }
  try { await api.categories.delete(id); toast('دسته‌بندی حذف شد', 'success'); [state.categories, state.products] = await Promise.all([api.categories.getAll(), api.products.getAll()]); renderCategories(); } catch (e) { toast(e.message, 'error'); }
}
