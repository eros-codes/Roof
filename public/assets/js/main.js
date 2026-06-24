export function initMobileDrawer() {
	const hamburger = document.getElementById("mobile-hamburger");
	const drawer = document.getElementById("mobile-drawer");
	const closeBtn = document.getElementById("drawer-close");
	const backdrop = document.getElementById("drawer-backdrop");

	if (!hamburger || !drawer || !closeBtn || !backdrop) return;

	// ensure ARIA attributes are present for accessibility
	hamburger.setAttribute("aria-controls", drawer.id || "mobile-drawer");
	if (!hamburger.hasAttribute("aria-expanded")) hamburger.setAttribute("aria-expanded", "false");

	function openDrawer() {
		drawer.classList.add("open");
		backdrop.classList.add("visible");
		drawer.setAttribute("aria-hidden", "false");
		hamburger.setAttribute("aria-expanded", "true");
		// prevent background scroll
		document.documentElement.style.overflow = "hidden";
		document.body.style.overflow = "hidden";
	}

	function closeDrawer() {
		drawer.classList.remove("open");
		backdrop.classList.remove("visible");
		drawer.setAttribute("aria-hidden", "true");
		hamburger.setAttribute("aria-expanded", "false");
		document.documentElement.style.overflow = "";
		document.body.style.overflow = "";
	}

	hamburger.addEventListener("click", (e) => {
		e.stopPropagation();
		openDrawer();
	});

	closeBtn.addEventListener("click", (e) => {
		e.stopPropagation();
		closeDrawer();
	});

	backdrop.addEventListener("click", () => {
		closeDrawer();
	});

	document.addEventListener("click", (e) => {
		if (!drawer.classList.contains("open")) return;
		if (!drawer.contains(e.target) && !hamburger.contains(e.target)) {
			closeDrawer();
		}
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && drawer.classList.contains("open")) {
			closeDrawer();
		}
	});
}
