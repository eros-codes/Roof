export function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function mkBtn(text, classes = '', icon = '') {
  const btn = document.createElement('button');
  btn.className = `btn ${classes}`;
  btn.innerHTML = (icon ? icon : '') + (text ? `<span>${escapeHtml(text)}</span>` : '');
  return btn;
}

export function emptyState(title, sub) {
  const el = document.createElement('div');
  el.className = 'empty';
  el.innerHTML = `\n    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">\n      <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>\n    </svg>\n    <p class="empty-title">${escapeHtml(title)}</p>\n    <p class="empty-sub">${escapeHtml(sub)}</p>`;
  return el;
}
