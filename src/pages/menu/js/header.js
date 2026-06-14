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

	categoriesContainer.innerHTML = "";
	const fragment = document.createDocumentFragment();

	const allLi = document.createElement("li");
	const allA = document.createElement("a");
	allA.href = "#";
	allA.textContent = "همه";
	allLi.appendChild(allA);
	allLi.classList.add("selected");
	fragment.appendChild(allLi);

	categories[type].forEach((cat) => {
		const li = document.createElement("li");
		const a = document.createElement("a");
		a.href = "#";
		a.textContent = cat.name;
		li.appendChild(a);
		fragment.appendChild(li);
	});

	categoriesContainer.appendChild(fragment);
}
