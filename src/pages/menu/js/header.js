import { categories } from "./state.js";

export function toggleCategories(active = "cafe") {
	const cafeCats = document.getElementById("cafe-cats");
	const restCats = document.getElementById("rest-cats");
	if (cafeCats) {
		if (active === "cafe") cafeCats.classList.add("selected");
		else cafeCats.classList.remove("selected");
	}
	if (restCats) {
		if (active === "restaurant") restCats.classList.add("selected");
		else restCats.classList.remove("selected");
	}
}

export function renderCategories(type) {
	const categoriesContainer = document.querySelector(".menu-categories");
	if (!categoriesContainer) return;

	let currentCategory = localStorage.getItem("currentCategory");

	categoriesContainer.innerHTML = "";
	const fragment = document.createDocumentFragment();

	const filtered = categories.filter((cat) => cat.type === type);
	if (filtered.length === 0) {
		categoriesContainer.appendChild(fragment);
		return;
	}

	// ensure currentCategory belongs to this menu type; otherwise default to first category
	const currentCategoryNum = Number(currentCategory);
	const belongsToType = filtered.some((cat) => cat.id === currentCategoryNum);
	if (!currentCategory || !belongsToType) {
		const first = filtered[0];
		localStorage.setItem("currentCategory", String(first.id));
		currentCategory = String(first.id);
	}

	filtered.forEach((cat) => {
		const li = document.createElement("li");
		li.dataset.categoryId = cat.id;
		if (Number(currentCategory) === cat.id) {
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

export function switchMode(menuType) {
	// set current menu and update header UI/categories list
	localStorage.setItem("currentMenu", menuType);
	toggleCategories(menuType);
	renderCategories(menuType);
}
