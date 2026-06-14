import { products, categories } from "./js/state.js";
import { toggleCategories, renderCategories, switchMode } from "./js/header.js";
import { createCard } from "../../components/product-card/createCard.js";

document.addEventListener("DOMContentLoaded", () => {
	const categoriesContainer = document.querySelector(".menu-categories");
	const cafeCats = document.getElementById("cafe-cats");
	const restCats = document.getElementById("rest-cats");
	const menuMain = document.querySelector(".menu-main");

	const currentMenu = getCurrentMenu();

	// get current menu and category from localStorage, or default to 'cafe' and its first category
	function getCurrentMenu() {
		return localStorage.getItem("currentMenu") || "cafe";
	}
	// removed getCurrentCategory helper; read directly from localStorage when needed

	function renderProducts(productsList) {
		if (!menuMain) return;

		menuMain.innerHTML = "";

		const fragment = document.createDocumentFragment();

		productsList.forEach((product) => {
			fragment.appendChild(createCard(product));
		});

		menuMain.appendChild(fragment);
	}

	// On first visit: if no menu set, default to 'cafe' and set its first category
	if (!localStorage.getItem("currentMenu")) {
		localStorage.setItem("currentMenu", "cafe");
		const firstCafeCat = categories.find((c) => c.type === "cafe");
		if (firstCafeCat) {
			localStorage.setItem("currentCategory", String(firstCafeCat.id));
		}
	}

	// Render categories for the current menu type
	if (cafeCats) {
		cafeCats.addEventListener("click", () => {
			const firstCafeCat = categories.find((c) => c.type === "cafe");
			if (firstCafeCat) {
				localStorage.setItem("currentCategory", String(firstCafeCat.id));
			} else {
				localStorage.removeItem("currentCategory");
			}
			switchMode("cafe");
			const catId = localStorage.getItem("currentCategory");
			if (catId) {
				const filtered = products.filter((p) => p.categoryId === Number(catId));
				renderProducts(filtered);
			} else {
				menuMain.innerHTML = "";
			}
		});
	}
	if (restCats) {
		restCats.addEventListener("click", () => {
			const firstRestCat = categories.find((c) => c.type === "restaurant");
			if (firstRestCat) {
				localStorage.setItem("currentCategory", String(firstRestCat.id));
			} else {
				localStorage.removeItem("currentCategory");
			}
			switchMode("restaurant");
			const catId = localStorage.getItem("currentCategory");
			if (catId) {
				const filtered = products.filter((p) => p.categoryId === Number(catId));
				renderProducts(filtered);
			} else {
				menuMain.innerHTML = "";
			}
		});
	}

	if (categoriesContainer && menuMain) {
		categoriesContainer.addEventListener("click", (e) => {
			const li = e.target.closest("li");
			if (!li || !categoriesContainer.contains(li)) return;
			e.preventDefault();
			categoriesContainer.querySelectorAll("li").forEach((n) => n.classList.remove("selected"));
			li.classList.add("selected");

			const categoryId = Number(li.dataset.categoryId);
			if (Number.isNaN(categoryId)) return;
			localStorage.setItem("currentCategory", String(categoryId));

			const filteredProducts = products.filter((p) => p.categoryId === categoryId);
			renderProducts(filteredProducts);
		});
	}

	// initialize UI and content for the current menu
	switchMode(currentMenu);
	const initCat = localStorage.getItem("currentCategory");
	if (initCat) {
		const filtered = products.filter((p) => p.categoryId === Number(initCat));
		renderProducts(filtered);
	} else {
		menuMain.innerHTML = "";
	}
});