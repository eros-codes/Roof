import { products } from "./js/state.js";
import { changeMenu } from "./js/header.js";
import { createCard } from "../../components/product-card/createCard.js";

document.addEventListener("DOMContentLoaded", () => {
	const categoriesContainer = document.querySelector(".menu-categories");
	const cafeCats = document.getElementById("cafe-cats");
	const restCats = document.getElementById("rest-cats");
	const menuMain = document.querySelector(".menu-main");

	// localStorage helpers
	const safeLocal = {
		get(key, fallback = null) {
			try {
				const v = localStorage.getItem(key);
				return v === null ? fallback : v;
			} catch (e) {
				return fallback;
			}
		},
		set(key, value) {
			try {
				localStorage.setItem(key, String(value));
			} catch (e) {}
		},
		remove(key) {
			try {
				localStorage.removeItem(key);
			} catch (e) {}
		},
	};

	// helpers
	function getCurrentMenu() {
		return safeLocal.get("currentMenu", "cafe");
	}
	function getProductsByCategory(categoryId) {
		return products.filter((product) => product.categoryId === categoryId);
	}
	
	function renderProducts(productsList) {
		if (!menuMain) return;

		menuMain.innerHTML = "";

		if (productsList.length === 0) {
			menuMain.textContent = "به زودی محصولات این دسته اضافه خواهند شد!";
			return;
		}

		const fragment = document.createDocumentFragment();

		productsList.forEach((product) => {
			fragment.appendChild(createCard(product));
		});

		menuMain.appendChild(fragment);
	}

	// Render categories for the current menu type
	if (cafeCats) {
		cafeCats.addEventListener("click", () => {
			if (getCurrentMenu() === "cafe") return;

			const selectedId = changeMenu("cafe");

			if (selectedId != null) {
				renderProducts(getProductsByCategory(selectedId));
			}
		});
	}
	if (restCats) {
		restCats.addEventListener("click", () => {
			if (getCurrentMenu() === "restaurant") return;

			const selectedId = changeMenu("restaurant");

			if (selectedId != null) {
				renderProducts(getProductsByCategory(selectedId));
			}
		});
	}

	// Handle category selection and product rendering
	if (categoriesContainer && menuMain) {
		categoriesContainer.addEventListener("click", (e) => {
			const li = e.target.closest("li");
			if (!li || !categoriesContainer.contains(li)) return;
			e.preventDefault();
			categoriesContainer.querySelectorAll("li").forEach((n) => n.classList.remove("selected"));
			li.classList.add("selected");

			const raw = li.dataset.categoryId;
			const categoryId = raw !== undefined ? Number(raw) : NaN;
			if (!Number.isFinite(categoryId)) return;
			safeLocal.set("currentCategory", String(categoryId));

			renderProducts(getProductsByCategory(categoryId));
		});
	}

	// initialize UI and content for the current menu
	const initCat = changeMenu(getCurrentMenu());
	if (initCat != null) {
		renderProducts(getProductsByCategory(initCat));
	} else {
		renderProducts([]);
	}
});