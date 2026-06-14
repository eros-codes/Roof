import { products } from "./js/state.js";
import { toggleCategories, renderCategories } from "./js/header.js";

document.addEventListener("DOMContentLoaded", () => {
	const categoriesContainer = document.querySelector(".menu-categories");
	const cafeCats = document.getElementById("cafe-cats");
	const restCats = document.getElementById("rest-cats");

	const currentMenu = localStorage.getItem("currentMenu") || "cafe";

	if (currentMenu === "cafe") {
		if (cafeCats) cafeCats.classList.add("selected");
		if (restCats) restCats.classList.remove("selected");
	} else {
		if (restCats) restCats.classList.add("selected");
		if (cafeCats) cafeCats.classList.remove("selected");
	}
	renderCategories(currentMenu);

	if (cafeCats) {
		cafeCats.addEventListener("click", () => {
			localStorage.setItem("currentMenu", "cafe");
			toggleCategories(cafeCats.dataset.menu);
			renderCategories(cafeCats.dataset.menu);
		});
	}
	if (restCats) {
		restCats.addEventListener("click", () => {
			localStorage.setItem("currentMenu", "restaurant");
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

			const categoryId = li.dataset.categoryId;
			let filteredProducts;
			if (categoryId === "all") {
				filteredProducts = products;
			} else {
				filteredProducts = products.filter(
					(p) => p.categoryId.toString() === categoryId
				);
			}
			
		});
	}
});