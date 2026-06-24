function safeGetItem(key, fallback = null) {
	try {
		const v = localStorage.getItem(key);
		return v === null ? fallback : v;
	} catch (e) {
		return fallback;
	}
}

function safeSetItem(key, value) {
	try {
		localStorage.setItem(key, String(value));
	} catch (e) {}
}

function safeRemoveItem(key) {
	try {
		localStorage.removeItem(key);
	} catch (e) {}
}

export function toggleCategories(active = "cafe") {
	const cafeCats = document.getElementById("cafe-cats");
	const restCats = document.getElementById("rest-cats");
	const bfCats = document.getElementById("breakfast-cats");
	if (cafeCats) {
		if (active === "cafe") cafeCats.classList.add("selected");
		else cafeCats.classList.remove("selected");
	}
	if (restCats) {
		if (active === "restaurant") restCats.classList.add("selected");
		else restCats.classList.remove("selected");
	}
	if (bfCats) {
		if (active === "breakfast") bfCats.classList.add("selected");
		else bfCats.classList.remove("selected");
	}
}

export function renderCategories(type, categories) {
	const categoriesContainer = document.querySelector(".menu-categories");
	if (!categoriesContainer) return;
	const currentCategoryRaw = safeGetItem("currentCategory", null);

	categoriesContainer.innerHTML = "";
	const fragment = document.createDocumentFragment();

	const filtered = (categories || []).filter((cat) => cat.type === type);
	if (filtered.length === 0) {
		categoriesContainer.appendChild(fragment);
		return;
	}

	filtered.forEach((cat) => {
		const li = document.createElement("li");
		li.dataset.categoryId = cat.id;
		if (currentCategoryRaw !== null && Number(currentCategoryRaw) === cat.id) {
			li.classList.add("selected");
		}
		const a = document.createElement("a");
		a.href = "#";
		a.textContent = cat.name;
		li.appendChild(a);
		fragment.appendChild(li);
	});

	categoriesContainer.appendChild(fragment);
}

export function changeMenu(menuType, categories) {
	// set current menu and update header UI/categories list
	safeSetItem("currentMenu", menuType);

	// decide which category should be selected for this menu
	const filtered = (categories || []).filter((c) => c.type === menuType);
	const currentCategoryRaw = safeGetItem("currentCategory", null);
	const currentCategoryNum = currentCategoryRaw !== null ? Number(currentCategoryRaw) : NaN;
	const belongsToType = Number.isFinite(currentCategoryNum) && filtered.some((cat) => cat.id === currentCategoryNum);
	let selectedCategoryId = null;
	if (Number.isFinite(currentCategoryNum) && belongsToType) {
		selectedCategoryId = currentCategoryNum;
	} else if (filtered.length > 0) {
		selectedCategoryId = filtered[0].id;
		safeSetItem("currentCategory", String(selectedCategoryId));
	} else {
		safeRemoveItem("currentCategory");
	}

	toggleCategories(menuType);
	renderCategories(menuType, categories);

	return selectedCategoryId;
}

// Initialize header UI enhancements: sliding indicator, scroll hide/show, keyboard nav
export function initHeaderUI() {
	const categoriesContainer = document.querySelector('.menu-categories');
	const header = document.querySelector('.menu-header');
	if (!categoriesContainer || !header) return;

	// create type indicator for the top menu-options (cafe/restaurant/breakfast)
	const menuOptions = document.querySelector('.menu-options');
	let typeIndicator = null;
	if (menuOptions) {
		menuOptions.style.position = menuOptions.style.position || '';
		typeIndicator = menuOptions.querySelector('.type-indicator');
		if (!typeIndicator) {
			typeIndicator = document.createElement('span');
			typeIndicator.className = 'type-indicator';
			menuOptions.appendChild(typeIndicator);
		}

		function moveTypeIndicatorTo(btn) {
			if (!btn) {
				typeIndicator.style.opacity = '0';
				return;
			}
			const containerRect = menuOptions.getBoundingClientRect();
			const rect = btn.getBoundingClientRect();
			const left = rect.left - containerRect.left + (menuOptions.scrollLeft || 0);
			typeIndicator.style.width = `${rect.width}px`;
			typeIndicator.style.transform = `translateX(${left}px)`;
			typeIndicator.style.opacity = '1';
		}

		function updateTypeToSelected() {
			let sel = menuOptions.querySelector('button.selected');
			if (!sel) {
				const cur = safeGetItem('currentMenu', null);
				if (cur) {
					// map stored menu key to button id
					let id = `${cur}-cats`;
					if (cur === 'restaurant') id = 'rest-cats';
					sel = menuOptions.querySelector(`#${id}`);
				}
			}
			if (sel) moveTypeIndicatorTo(sel);
			else typeIndicator.style.opacity = '0';
		}

		window.__menu_update_type_indicator = updateTypeToSelected;

		// initial placement for type indicator (only based on selected or localStorage)
		updateTypeToSelected();
	}

	// (category hover/focus indicator removed) - keep keyboard navigation below

	// keyboard navigation: arrow keys, home/end, enter/space
	categoriesContainer.addEventListener('keydown', (e) => {
		const key = e.key;
		const anchors = Array.from(categoriesContainer.querySelectorAll('a'));
		if (anchors.length === 0) return;

		// find current index
		let active = document.activeElement;
		let idx = anchors.indexOf(active);
		if (idx === -1) {
			const li = active && active.closest && active.closest('li');
			if (li) {
				const a = li.querySelector('a');
				idx = anchors.indexOf(a);
			}
		}

		if (key === 'ArrowLeft' || key === 'ArrowRight') {
			e.preventDefault();
			let next;
			if (idx === -1) next = 0;
			else if (key === 'ArrowLeft') next = (idx - 1 + anchors.length) % anchors.length;
			else next = (idx + 1) % anchors.length;
			anchors[next].focus();
			anchors[next].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
		} else if (key === 'Home') {
			e.preventDefault();
			anchors[0].focus();
			anchors[0].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
		} else if (key === 'End') {
			e.preventDefault();
			const last = anchors[anchors.length - 1];
			last.focus();
			last.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
		} else if (key === 'Enter' || key === ' ') {
			// trigger click so existing handlers run (selection + fetch)
			const li = document.activeElement && document.activeElement.closest && document.activeElement.closest('li');
			if (li) {
				e.preventDefault();
				li.click();
			}
		}
	});
	// keep type indicator placement updated on resize
	window.addEventListener('resize', () => {
		if (window.__menu_update_type_indicator) window.__menu_update_type_indicator();
	});
	// ensure type indicator is placed if present
	if (window.__menu_update_type_indicator) window.__menu_update_type_indicator();
}
export function updateTypeIndicatorToSelected() {
	if (window.__menu_update_type_indicator) window.__menu_update_type_indicator();
}

