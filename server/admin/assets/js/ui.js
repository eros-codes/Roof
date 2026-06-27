export const ICONS = {
  success: `<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error: `<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  info: `<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  picture: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
};

const THEME_KEY = 'roof:admin:theme';
const ICON_SUN = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`;
const ICON_MOON = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

export function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `${ICONS[type] || ICONS.info}${msg}`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove());
  }, 3200);
}

export function confirm(msg, title = 'تأیید عملیات') {
  return new Promise((resolve) => {
    const backdrop = document.getElementById('confirm-backdrop');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent = msg;
    backdrop.hidden = false;

    const yes = document.getElementById('confirm-yes');
    const no = document.getElementById('confirm-no');

    function cleanup(result) {
      backdrop.hidden = true;
      yes.replaceWith(yes.cloneNode(true));
      no.replaceWith(no.cloneNode(true));
      resolve(result);
    }

    document.getElementById('confirm-yes').onclick = () => cleanup(true);
    document.getElementById('confirm-no').onclick = () => cleanup(false);
  });
}

export function openModal(opts) {
  const { title, fields, onSubmit, submitText = 'ذخیره', initialValues = {} } = opts;
  document.getElementById('modal-title').textContent = title;
  const body = document.getElementById('modal-body');
  body.innerHTML = '';
  const form = document.createElement('form');
  form.id = 'modal-form';
  form.noValidate = true;
  const grid = document.createElement('div');
  grid.className = 'form-grid';
  fields.forEach((f) => {
    const wrapper = document.createElement('div');
    wrapper.className = `field${f.wide ? ' form-grid--single' : ''}`;
    const label = document.createElement('label');
    label.className = 'field-label';
    label.htmlFor = `mf-${f.name}`;
    label.innerHTML = f.label + (f.optional ? ` <span class="field-optional">(اختیاری)</span>` : '');
    wrapper.appendChild(label);
    let input;
    if (f.type === 'textarea') {
      input = document.createElement('textarea');
      input.className = 'field-input field-textarea';
      input.rows = 3;
    } else if (f.type === 'select') {
      input = document.createElement('select');
      input.className = 'field-input field-select';
      (f.options || []).forEach((opt) => {
        const o = document.createElement('option');
        o.value = opt.value; o.textContent = opt.label; input.appendChild(o);
      });
    } else {
      input = document.createElement('input');
      input.type = f.type || 'text';
      input.className = 'field-input';
      if (f.placeholder) input.placeholder = f.placeholder;
    }
    // determine autocomplete attribute
    try {
      if (f.autocomplete) {
        input.setAttribute('autocomplete', f.autocomplete);
      } else if (input && input.type === 'password') {
        // if the modal is for creating a new entity (title or submitText contains keywords), suggest new-password
        const ctx = String((title || '') + ' ' + (submitText || '')).trim();
        const isNew = /جدید|ثبت|افزودن|جدید/i.test(ctx);
        input.setAttribute('autocomplete', isNew ? 'new-password' : 'current-password');
      } else if (f.name === 'username' || (f.name && String(f.name).toLowerCase().includes('user'))) {
        input.setAttribute('autocomplete', 'username');
      } else if (input && input.type === 'email') {
        input.setAttribute('autocomplete', 'email');
      } else if (f.name && /first|given/i.test(f.name)) {
        input.setAttribute('autocomplete', 'given-name');
      } else if (f.name && /last|family/i.test(f.name)) {
        input.setAttribute('autocomplete', 'family-name');
      } else if (f.name && /phone|tel/i.test(f.name)) {
        input.setAttribute('autocomplete', 'tel');
      } else if (f.name && /address/i.test(f.name)) {
        input.setAttribute('autocomplete', 'street-address');
      }
    } catch (ignored) {
      // ignore attribute setting errors
    }
    input.id = `mf-${f.name}`; input.name = f.name;
    if (!f.optional && f.type !== 'select') input.required = true;
    if (initialValues[f.name] !== undefined) {
      if (f.type === 'select') input.value = String(initialValues[f.name]); else input.value = initialValues[f.name] ?? '';
    }
    wrapper.appendChild(input);
    grid.appendChild(wrapper);
  });
  form.appendChild(grid);
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button'; cancelBtn.className = 'btn btn--ghost'; cancelBtn.textContent = 'انصراف'; cancelBtn.onclick = closeModal;
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit'; submitBtn.className = 'btn btn--accent'; submitBtn.innerHTML = `<span class="btn-text">${submitText}</span>`;
  footer.appendChild(cancelBtn); footer.appendChild(submitBtn); form.appendChild(footer); body.appendChild(form);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    submitBtn.disabled = true; submitBtn.innerHTML = `<span class="btn-spinner"></span>`;
    try { await onSubmit(data); closeModal(); } catch (err) { toast(err.message, 'error'); submitBtn.disabled = false; submitBtn.innerHTML = `<span class="btn-text">${submitText}</span>`; }
  };
  document.getElementById('modal-backdrop').hidden = false;
}

export function closeModal() { document.getElementById('modal-backdrop').hidden = true; document.getElementById('modal-body').innerHTML = ''; }

export function initTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    const theme = stored === 'dark' ? 'dark' : 'light';
    applyTheme(theme);
  } catch (_) {
    /* ignore localStorage access failures */
  }
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('theme-dark');
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (_) {
        /* ignore localStorage write failures */
      }
    });
  }
}

function setToggleIcon(btn, theme) { if (!btn) return; btn.innerHTML = theme === 'dark' ? ICON_MOON : ICON_SUN; }
function applyTheme(theme) { if (theme === 'dark') document.documentElement.classList.add('theme-dark'); else document.documentElement.classList.remove('theme-dark'); const btn = document.getElementById('theme-toggle'); if (btn) { btn.setAttribute('aria-pressed', theme === 'dark'); setToggleIcon(btn, theme); } }
