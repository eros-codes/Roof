import { categories } from "./mock-state.js";

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
	const bfCats = document.getElementById("breakefast-cats");
	if (cafeCats) {
		if (active === "cafe") cafeCats.classList.add("selected");
		else cafeCats.classList.remove("selected");
	}
	if (restCats) {
		if (active === "restaurant") restCats.classList.add("selected");
		else restCats.classList.remove("selected");
	}
	if (bfCats) {
		if (active === "breakefast") bfCats.classList.add("selected");
		else bfCats.classList.remove("selected");
	}
}

export function renderCategories(type) {
	const categoriesContainer = document.querySelector(".menu-categories");
	if (!categoriesContainer) return;
	const currentCategoryRaw = safeGetItem("currentCategory", null);

	categoriesContainer.innerHTML = "";
	const fragment = document.createDocumentFragment();

	const filtered = categories.filter((cat) => cat.type === type);
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

export function changeMenu(menuType) {
	// set current menu and update header UI/categories list
	safeSetItem("currentMenu", menuType);

	// decide which category should be selected for this menu
	const filtered = categories.filter((c) => c.type === menuType);
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
	renderCategories(menuType);

	return selectedCategoryId;
}

