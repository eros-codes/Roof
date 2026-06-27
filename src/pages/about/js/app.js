// ─── Bootstrap ───────────────────────────────────────────────────────────────
document.body.classList.add("js-ready");

// ─── Header: shrink + blur on scroll ─────────────────────────────────────────
function initHeader() {
	const header = document.getElementById("s-header");
	if (!header) return;
	const update = () => header.classList.toggle("is-scrolled", window.scrollY > 55);
	window.addEventListener("scroll", update, { passive: true });
	update();
}

// ─── Reveal on scroll (IntersectionObserver + sibling stagger) ────────────────
function initReveal() {
	const io = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				const el = entry.target;
				// Find stagger parent (explicit or immediate parent)
				const staggerParent =
					el.closest("[data-stagger]") || el.parentElement;
				const siblings = [
					...staggerParent.querySelectorAll("[data-reveal]"),
				];
				const idx = siblings.indexOf(el);
				el.style.transitionDelay = `${idx * 0.09}s`;
				el.classList.add("is-revealed");
				io.unobserve(el);
			});
		},
		{ threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
	);
	document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
}

// ─── Counter animation ────────────────────────────────────────────────────────
function initCounters() {
	const P = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
	const toPersian = (n) => String(n).replace(/\d/g, (d) => P[+d]);

	const io = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				const el = entry.target;
				let target = parseInt(el.dataset.count, 10);
				if (!Number.isFinite(target) || target < 0) target = 0;
				const t0 = performance.now();
				const dur = 1500;
				const tick = (now) => {
					const progress = Math.min((now - t0) / dur, 1);
					// ease-out cubic
					const eased = 1 - Math.pow(1 - progress, 3);
					el.textContent = toPersian(Math.round(eased * target));
					if (progress < 1) requestAnimationFrame(tick);
				};
				requestAnimationFrame(tick);
				io.unobserve(el);
			});
		},
		{ threshold: 0.5 }
	);
	document.querySelectorAll("[data-count]").forEach((el) => io.observe(el));
}

// ─── Hero parallax (CSS variable approach, GPU-friendly) ─────────────────────
function initParallax() {
	const bg = document.querySelector(".s-hero__bg");
	if (!bg) return;
	let ticking = false;
	let lastY = 0;

	function doUpdate() {
		const heroH = bg.parentElement?.offsetHeight || 0;
		if (lastY < heroH) {
			bg.style.transform = `translateY(${lastY * 0.28}px)`;
		}
		ticking = false;
	}

	const onScroll = () => {
		lastY = window.scrollY;
		if (!ticking) {
			ticking = true;
			requestAnimationFrame(doUpdate);
		}
	};

	window.addEventListener("scroll", onScroll, { passive: true });
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
	initHeader();
	initReveal();
	initCounters();
	initParallax();
});
