import * as api from './api.js';
import { toast, openModal, confirm } from './ui.js';
import { mkBtn, emptyState, escapeHtml } from './helpers.js';
import { state } from './state.js';

export async function loadReviews() {
  state.reviews = await api.reviews.getAll();
}

export function renderReviews() {
  const el = document.getElementById('section-reviews');
  const all = state.reviews;
  const pending = all.filter((r) => !r.visible);
  const approved = all.filter((r) => r.visible);

  let list = state.reviewFilter === 'pending' ? pending : state.reviewFilter === 'approved' ? approved : all;
  el.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'section-header';
  header.innerHTML = `<div><h1 class="section-title">نظرات</h1><p class="section-sub">${all.length} نظر ثبت شده</p></div>`;
  el.appendChild(header);

  const stats = document.createElement('div');
  stats.className = 'stats-row';
  stats.innerHTML = `\n    <div class="stat-card"><div class="stat-label">کل</div><div class="stat-value">${all.length}</div></div>\n    <div class="stat-card stat-card--pending"><div class="stat-label">در انتظار</div><div class="stat-value">${pending.length}</div></div>\n    <div class="stat-card stat-card--approved"><div class="stat-label">تأیید شده</div><div class="stat-value">${approved.length}</div></div>`;
  el.appendChild(stats);

  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  [['all', 'همه'], ['pending', 'در انتظار'], ['approved', 'تأیید شده']].forEach(([val, label]) => {
    const btn = document.createElement('button');
    btn.className = `tab${state.reviewFilter === val ? ' active' : ''}`;
    btn.textContent = label;
    btn.onclick = () => { state.reviewFilter = val; renderReviews(); };
    tabs.appendChild(btn);
  });
  el.appendChild(tabs);

  if (list.length === 0) { el.appendChild(emptyState('هیچ نظری پیدا نشد', 'در این دسته‌بندی نظری وجود ندارد')); return; }

  const listEl = document.createElement('div');
  listEl.className = 'reviews-list';
  list.forEach((r) => {
    const trimmedName = r.name ? String(r.name).trim() : '';
    const initials = trimmedName ? trimmedName[0] : '؟';
    const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('fa-IR') : '—';
    const card = document.createElement('div');
    card.className = `review-card review-card--${r.visible ? 'approved' : 'pending'}`;
    card.innerHTML = `\n      <div class="review-top">\n        <div class="review-author">\n          <div class="review-avatar">${escapeHtml(initials)}</div>\n          <div>\n            <div class="review-name">${escapeHtml(r.name) || 'ناشناس'}</div>\n            <div class="review-date">${dateStr}</div>\n          </div>\n        </div>\n        <span class="badge badge--${r.visible ? 'approved' : 'pending'}">${r.visible ? 'تأیید شده' : 'در انتظار'}</span>\n      </div>\n      <p class="review-text">${escapeHtml(r.text)}</p>\n      ${r.reply ? `<div class="review-reply"><div class="review-reply-label">پاسخ روف</div>${escapeHtml(r.reply)}</div>` : ''}\n      <div class="review-actions"></div>`;
    const actions = card.querySelector('.review-actions');
    if (!r.visible) {
      const approveBtn = mkBtn('تأیید', 'btn--success btn--sm');
      approveBtn.onclick = async () => {
        try {
          const updated = await api.reviews.update(r.id, { visible: true });
          state.reviews = state.reviews.map((item) => (item.id === r.id ? updated : item));
          toast('نظر تأیید شد', 'success');
          renderReviews();
        } catch (e) {
          toast(e.message || 'خطا در تأیید نظر', 'error');
          console.error('approve review failed', e);
        }
      };
      actions.appendChild(approveBtn);
    } else {
      const rejectBtn = mkBtn('رد کردن', 'btn--ghost btn--sm');
      rejectBtn.onclick = async () => {
        try {
          const updated = await api.reviews.update(r.id, { visible: false });
          state.reviews = state.reviews.map((item) => (item.id === r.id ? updated : item));
          toast('نظر رد شد', 'info');
          renderReviews();
        } catch (e) {
          toast(e.message || 'خطا در رد کردن نظر', 'error');
          console.error('reject review failed', e);
        }
      };
      actions.appendChild(rejectBtn);
    }
    const replyBtn = mkBtn(r.reply ? 'ویرایش پاسخ' : 'پاسخ', 'btn--ghost btn--sm');
    replyBtn.onclick = () => replyToReview(r);
    actions.appendChild(replyBtn);
    const deleteBtn = mkBtn('حذف', 'btn--danger btn--sm');
    deleteBtn.onclick = async () => {
      try {
        const ok = await confirm('این نظر برای همیشه حذف می‌شود. ادامه می‌دهید؟', 'حذف نظر');
        if (!ok) return;
        await api.reviews.delete(r.id);
        state.reviews = state.reviews.filter((item) => item.id !== r.id);
        toast('نظر حذف شد', 'success');
        renderReviews();
      } catch (e) {
        toast(e.message || 'خطا در حذف نظر', 'error');
        console.error('delete review failed', e);
      }
    };
    actions.appendChild(deleteBtn);
    listEl.appendChild(card);
  });
  el.appendChild(listEl);
}

function replyToReview(r) {
  openModal({
    title: 'پاسخ به نظر',
    fields: [{ name: 'reply', label: 'متن پاسخ', type: 'textarea', wide: true, placeholder: 'پاسخ روف...' }],
    initialValues: { reply: r.reply || '' },
    submitText: 'ارسال پاسخ',
    onSubmit: async ({ reply }) => {
      const updated = await api.reviews.update(r.id, { reply: reply.trim() || null });
      state.reviews = state.reviews.map((item) => (item.id === r.id ? updated : item));
      toast('پاسخ ثبت شد', 'success');
      renderReviews();
    },
  });
}

export { replyToReview };
