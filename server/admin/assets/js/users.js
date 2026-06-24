import * as api from './api.js';
import { toast, openModal, confirm } from './ui.js';
import { mkBtn, emptyState } from './helpers.js';
import { state } from './state.js';

async function getCurrentRole() {
  try {
    const t = api.token.get();
    if (!t) return null;
    const payload = t.split('.')[1];
    const json = JSON.parse(decodeURIComponent(escape(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))));
    if (json.role) return json.role;
    // fallback: fetch admins list and match username from token
    const username = json.username;
    if (!username) return null;
    try {
      const list = await api.admins.getAll();
      const me = list.find((a) => a.username === username);
      return me ? me.role : null;
    } catch (e) {
      return null;
    }
  } catch (e) { return null; }
}

function getCurrentAdminId() {
  try {
    const t = api.token.get();
    if (!t) return null;
    const payload = t.split('.')[1];
    const json = JSON.parse(decodeURIComponent(escape(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))));
    return Number(json.id) || null;
  } catch (e) { return null; }
}

export async function loadUsers() {
  state.users = await api.admins.getAll();
}

export async function renderUsers() {
  const el = document.getElementById('section-users');
  const list = state.users || [];
  el.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `<div><h1 class="section-title">ادمین‌ها</h1><p class="section-sub">${list.length} ادمین</p></div>`;
  el.appendChild(header);

  const role = await getCurrentRole();
  const canCreate = role === 'MAIN';
  if (canCreate) {
    const addBtn = mkBtn('ثبت ادمین جدید', 'btn--accent');
    addBtn.onclick = () => openCreateAdminModal();
    header.appendChild(addBtn);
  }

  if (list.length === 0) { el.appendChild(emptyState('هیچ ادمینی ثبت نشده', 'در حال حاضر ادمینی وجود ندارد')); return; }

  const table = document.createElement('div');
  table.className = 'users-table';
  list.forEach((u) => {
    const row = document.createElement('div');
    row.className = 'user-row';
    const dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString('fa-IR') : '—';
    row.innerHTML = `
      <div class="user-info">
        <div class="user-name">${u.firstName} ${u.lastName}</div>
        <div class="user-username">@${u.username}</div>
      </div>
      <div class="user-meta">
        <div class="user-role">${u.role === 'MAIN' ? 'ادمین اصلی' : 'ادمین فرعی'}</div>
        <div class="user-date">${dateStr}</div>
      </div>
      <div class="user-actions"></div>
    `;
    const actions = row.querySelector('.user-actions');

    if (role === 'MAIN') {
      const editBtn = mkBtn('ویرایش', 'btn--ghost btn--sm');
      editBtn.onclick = () => openEditAdminModal(u);
      actions.appendChild(editBtn);

      const delBtn = mkBtn('حذف', 'btn--danger btn--sm');
      delBtn.onclick = async () => {
        const ok = await confirm('این ادمین برای همیشه حذف می‌شود. ادامه می‌دهید؟', 'حذف ادمین');
        if (!ok) return;
        try {
          await api.admins.delete(u.id);
          const currentId = getCurrentAdminId();
          if (currentId === u.id) {
            api.token.remove();
            toast('شما خودتان را حذف کردید؛ خارج می‌شوید.', 'info');
            window.location.href = 'index.html';
            return;
          }
          toast('ادمین حذف شد', 'success');
          state.users = await api.admins.getAll();
          renderUsers();
        } catch (e) {
          toast(e.message || 'خطا در حذف ادمین', 'error');
        }
      };
      actions.appendChild(delBtn);
    }

    table.appendChild(row);
  });
  el.appendChild(table);
}

function openCreateAdminModal() {
  openModal({
    title: 'ثبت ادمین جدید',
    fields: [
      { name: 'firstName', label: 'نام', type: 'text' },
      { name: 'lastName', label: 'نام خانوادگی', type: 'text' },
      { name: 'username', label: 'نام کاربری', type: 'text' },
      { name: 'password', label: 'رمز عبور', type: 'password' },
      { name: 'role', label: 'نقش', type: 'select', options: [ { value: 'MAIN', label: 'ادمین اصلی' }, { value: 'SECONDARY', label: 'ادمین فرعی' } ] },
    ],
    submitText: 'ثبت ادمین',
    onSubmit: async (data) => {
      data.firstName = data.firstName || 'admin';
      data.lastName = data.lastName || 'admin';
      data.role = data.role || 'SECONDARY';
      await api.admins.create(data);
      toast('ادمین جدید ثبت شد', 'success');
      state.users = await api.admins.getAll();
      renderUsers();
    }
  });
}

function openEditAdminModal(u) {
  openModal({
    title: 'ویرایش ادمین',
    fields: [
      { name: 'firstName', label: 'نام', type: 'text' },
      { name: 'lastName', label: 'نام خانوادگی', type: 'text' },
      { name: 'username', label: 'نام کاربری', type: 'text' },
      { name: 'password', label: 'رمز عبور (در صورت تغییر)' , type: 'password', optional: true },
      { name: 'role', label: 'نقش', type: 'select', options: [ { value: 'MAIN', label: 'ادمین اصلی' }, { value: 'SECONDARY', label: 'ادمین فرعی' } ] },
    ],
    initialValues: { firstName: u.firstName, lastName: u.lastName, username: u.username, role: u.role },
    submitText: 'ذخیره',
    onSubmit: async (data) => {
      const payload = { firstName: data.firstName || 'admin', lastName: data.lastName || 'admin', username: data.username };
      if (data.password) payload.password = data.password;
      if (data.role) payload.role = data.role;
      await api.admins.update(u.id, payload);
      toast('ویرایش انجام شد', 'success');
      state.users = await api.admins.getAll();
      renderUsers();
    }
  });
}

export { openCreateAdminModal };
