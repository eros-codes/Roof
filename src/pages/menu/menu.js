import { changeMenu, initHeaderUI, updateTypeIndicatorToSelected } from "./js/header.js";
import { fetchCategories, fetchProducts } from "./js/api.js";
import { initMobileDrawer } from "../../../public/assets/js/main.js";
import { createCard } from "../../components/product-card/createCard.js";

document.addEventListener("DOMContentLoaded", async () => {
	const categoriesContainer = document.querySelector(".menu-categories");
	const cafeCats = document.getElementById("cafe-cats");
	const restCats = document.getElementById("rest-cats");
	const bfCats = document.getElementById("breakfast-cats");
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

	async function getProductsByCategory(categoryId) {
		try {
			const prods = await fetchProducts(categoryId);
			return Array.isArray(prods) ? prods : [];
		} catch (e) {
			console.error("Failed to fetch products:", e);
			return [];
		}
	}
	
	function renderProducts(productsList) {
		if (!menuMain) return;

		menuMain.innerHTML = "";

		if (productsList.length === 0) {
			menuMain.textContent = "به زودی محصولات این دسته اضافه خواهند شد!";
			return;
		}

		const fragment = document.createDocumentFragment();

		productsList.forEach((product, i) => {
			const card = createCard(product);
			card.style.animationDelay = `${i * 0.04}s`;
			fragment.appendChild(card);
		});

		menuMain.appendChild(fragment);
	}

	// initialize header UI enhancements (indicator, scroll hide, keyboard nav)
	try {
		initHeaderUI();
	} catch (e) {}

	// Render categories for the current menu type
	if (cafeCats) {
		cafeCats.addEventListener("click", async () => {
			if (getCurrentMenu() === "cafe") return;

			const selectedId = changeMenu("cafe", window.__categories__);
			try { updateTypeIndicatorToSelected(); } catch (e) {}
			if (selectedId != null) {
				const prods = await getProductsByCategory(selectedId);
				renderProducts(prods);
			} else {
				renderProducts([]);
			}
		});
	}
	if (restCats) {
		restCats.addEventListener("click", async () => {
			if (getCurrentMenu() === "restaurant") return;

			const selectedId = changeMenu("restaurant", window.__categories__);
			try { updateTypeIndicatorToSelected(); } catch (e) {}
			if (selectedId != null) {
				const prods = await getProductsByCategory(selectedId);
				renderProducts(prods);
			} else {
				renderProducts([]);
			}
		});
	}
	if (bfCats) {
		bfCats.addEventListener("click", async () => {
			if (getCurrentMenu() === "breakfast") return;

			const selectedId = changeMenu("breakfast", window.__categories__);
			try { updateTypeIndicatorToSelected(); } catch (e) {}
			if (selectedId != null) {
				const prods = await getProductsByCategory(selectedId);
				renderProducts(prods);
			} else {
				renderProducts([]);
			}

		})
	}

	// Handle category selection and product rendering
	if (categoriesContainer && menuMain) {
		categoriesContainer.addEventListener("click", async (e) => {
			const li = e.target.closest("li");
			if (!li || !categoriesContainer.contains(li)) return;
			e.preventDefault();
			categoriesContainer.querySelectorAll("li").forEach((n) => n.classList.remove("selected"));
			li.classList.add("selected");
			try { updateTypeIndicatorToSelected(); } catch (e) {}

			const raw = li.dataset.categoryId;
			const categoryId = raw !== undefined ? Number(raw) : NaN;
			if (!Number.isFinite(categoryId)) return;
			safeLocal.set("currentCategory", String(categoryId));

			const prods = await getProductsByCategory(categoryId);
			renderProducts(prods);
		});
	}

	// initialize UI and content for the current menu
	// fetch categories from API and initialize
	let categories = [];
	try {
		categories = await fetchCategories();
		// expose categories to header handlers via a small global reference
		window.__categories__ = categories;
	} catch (e) {
		console.error("Failed to load categories:", e);
		categories = [];
		window.__categories__ = categories;
	}

	const initCat = changeMenu(getCurrentMenu(), categories);
	try { updateTypeIndicatorToSelected(); } catch (e) {}
	if (initCat != null) {
		const prods = await getProductsByCategory(initCat);
		renderProducts(prods);
	} else {
		renderProducts([]);
	}

	// initialize mobile drawer (if present)
	try {
		if (typeof initMobileDrawer === "function") initMobileDrawer();
	} catch (e) {
		// ignore
	}
});