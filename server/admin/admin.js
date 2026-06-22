import * as api from './assets/js/api.js';
import { initTheme, closeModal, openModal, toast, confirm, ICONS } from './assets/js/ui.js';
import { state } from './assets/js/state.js';
import { mkBtn, emptyState } from './assets/js/helpers.js';
import { loadReviews, renderReviews } from './assets/js/reviews.js';
import { loadProducts, renderProducts } from './assets/js/products.js';
import { loadCategories, renderCategories } from './assets/js/categories.js';

// Initialize theme when module loads
initTheme();

export async function navigate(section) {
	state.section = section;
	document.querySelectorAll('.nav-item[data-nav]').forEach((btn) => btn.classList.toggle('active', btn.dataset.nav === section));
	document.querySelectorAll('.section').forEach((el) => el.classList.toggle('active', el.id === `section-${section}`));
	await loadSection(section);
}

async function loadSection(section) {
	const el = document.getElementById(`section-${section}`);
	if (!el) return;
	el.innerHTML = `<div class="empty"><div class="skeleton" style="width:120px;height:16px;margin-bottom:.5rem"></div><div class="skeleton" style="width:80px;height:12px"></div></div>`;
	try {
		if (section === 'reviews') {
			await loadReviews();
			renderReviews();
		} else if (section === 'products') {
			await Promise.all([loadProducts(), loadCategories()]);
			renderProducts();
		} else if (section === 'categories') {
			await Promise.all([loadCategories(), loadProducts()]);
			renderCategories();
		}
	} catch (err) {
		el.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p class="empty-title">خطا در بارگذاری</p><p class="empty-sub">${err.message}</p></div>`;
	}
}

function attachSidebarBehavior() {
	const sidebar = document.querySelector('.sidebar');
	const sidebarToggle = document.getElementById('sidebar-toggle');
	if (sidebar) {
		if (!sidebar.classList.contains('visible')) sidebar.classList.add('hidden');
	}
	if (sidebarToggle) {
		const mq = window.matchMedia('(max-width:720px)');
		const updateToggle = () => {
			const mobile = mq.matches;
			sidebarToggle.hidden = !mobile;
			if (!mobile) { sidebar?.classList.remove('hidden'); sidebar?.classList.remove('visible'); }
			else { if (sidebar && !sidebar.classList.contains('visible')) sidebar.classList.add('hidden'); }
		};
		updateToggle();
		if (mq.addEventListener) mq.addEventListener('change', updateToggle); else mq.addListener(updateToggle);
		sidebarToggle.addEventListener('click', () => {
			const isVisible = sidebar.classList.toggle('visible');
			sidebar.classList.toggle('hidden', !isVisible);
			sidebarToggle.setAttribute('aria-expanded', String(isVisible));
		});
	}
	document.querySelectorAll('.nav-item[data-nav]').forEach((btn) => {
		btn.addEventListener('click', () => {
			navigate(btn.dataset.nav);
			if (window.matchMedia('(max-width:720px)').matches && sidebar) {
				sidebar.classList.remove('visible'); sidebar.classList.add('hidden'); document.getElementById('sidebar-toggle')?.setAttribute('aria-expanded', 'false');
			}
		});
	});
}

function attachModalHandlers() {
	const modalClose = document.getElementById('modal-close'); if (modalClose) modalClose.addEventListener('click', closeModal);
	const modalBackdrop = document.getElementById('modal-backdrop'); if (modalBackdrop) modalBackdrop.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
}

async function handleLogin(e) {
	e.preventDefault();
	const form = e.target;
	const btn = document.getElementById('login-btn');
	const errEl = document.getElementById('login-error');
	const spinner = btn.querySelector('.btn-spinner');
	const text = btn.querySelector('.btn-text');
	errEl.hidden = true; text.hidden = true; spinner.hidden = false; btn.disabled = true;
	try {
		const { username, password } = Object.fromEntries(new FormData(form));
		const { token } = await api.login(username, password);
		api.token.set(token);
		window.location.href = 'dashboard.html';
	} catch (err) { errEl.textContent = err.message; errEl.hidden = false; } finally { text.hidden = false; spinner.hidden = true; btn.disabled = false; }
}

function showDashboard(username) {
	const dashEl = document.getElementById('dashboard-view');
	if (dashEl) {
		const loginViewEl = document.getElementById('login-view'); if (loginViewEl) loginViewEl.hidden = true;
		dashEl.hidden = false;
		const userEl = document.getElementById('sidebar-username'); if (userEl) userEl.textContent = username || 'ادمین';
		attachSidebarBehavior(); attachModalHandlers(); navigate('reviews');
		return;
	}
	window.location.href = 'dashboard.html';
}

function logout() { api.token.remove(); window.location.href = 'index.html'; }

function init() {
	const loginForm = document.getElementById('login-form');
	if (loginForm) { loginForm.addEventListener('submit', handleLogin); if (api.token.exists()) window.location.href = 'dashboard.html'; }
	const dashEl = document.getElementById('dashboard-view');
	if (dashEl) {
		if (!api.token.exists()) { window.location.href = 'index.html'; return; }
		const logoutBtn = document.getElementById('logout-btn'); if (logoutBtn) logoutBtn.addEventListener('click', logout);
		attachSidebarBehavior(); attachModalHandlers(); navigate('reviews');
	}
}

document.addEventListener('DOMContentLoaded', init);
