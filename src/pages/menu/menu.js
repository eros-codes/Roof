import { categories } from "./js/state.js";
import { toggleCategories, renderCategories } from "./js/header.js";

document.addEventListener("DOMContentLoaded", () => {
	const categoriesContainer = document.querySelector(".menu-categories");
	const cafeCats = document.getElementById("cafe-cats");
	const restCats = document.getElementById("rest-cats");

	const currentCategory = localStorage.getItem("currentCategory") || "cafe";

	if (currentCategory === "cafe") {
		if (cafeCats) cafeCats.classList.add("selected");
		if (restCats) restCats.classList.remove("selected");
	} else {
		if (restCats) restCats.classList.add("selected");
		if (cafeCats) cafeCats.classList.remove("selected");
	}
	renderCategories(currentCategory);

	if (cafeCats) {
		cafeCats.addEventListener("click", () => {
			localStorage.setItem("currentCategory", "cafe");
			toggleCategories(cafeCats.dataset.menu);
			renderCategories(cafeCats.dataset.menu);
		});
	}
	if (restCats) {
		restCats.addEventListener("click", () => {
			localStorage.setItem("currentCategory", "restaurant");
			toggleCategories(restCats.dataset.menu);
			renderCategories(restCats.dataset.menu);
		});
	}

	if (categoriesContainer) {
		categoriesContainer.addEventListener("click", (e) => {
			const li = e.target.closest("li");
			if (!li || !categoriesContainer.contains(li)) return;
			e.preventDefault();
			categoriesContainer
				.querySelectorAll("li")
				.forEach((n) => n.classList.remove("selected"));
			li.classList.add("selected");
		});
	}
});