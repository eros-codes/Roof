import { postReview } from "./api.js";

export function initForm() {
	const form = document.getElementById("feedback-form");
	const textarea = document.getElementById("review-text");
	const charCount = document.getElementById("char-count");
	const feedback = document.getElementById("form-feedback");
	const submitBtn = document.getElementById("submit-btn");

	if (!form || !textarea) return;

	const MAX = 100;

	//  Character counter
	textarea.addEventListener("input", () => {
		const len = textarea.value.length;
		charCount.textContent = `${len.toLocaleString("fa-IR")} / ${MAX.toLocaleString("fa-IR")}`;
		charCount.classList.toggle("char-count--warn", len > MAX * 0.88);
	});

	//  Submit
	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const name = form.querySelector("#review-name")?.value.trim() || null;
		const text = textarea.value.trim();

		if (!text) {
			showFeedback("لطفاً نظر خود را وارد کنید.", "error");
			textarea.focus();
			return;
		}

		setLoading(true);

		try {
			await postReview({ name, text });
			setLoading(false);
			form.reset();
			charCount.textContent = `۰ / ${MAX.toLocaleString("fa-IR")}`;
			showFeedback("نظر شما ثبت شد و پس از بررسی نمایش داده خواهد شد 🙏", "success");
		} catch (err) {
			// If it's a client error (validation) or rate-limit, surface the message
			if (err && err.status && err.status >= 400 && err.status < 500) {
				setLoading(false);
				showFeedback(err.message || 'خطا در ثبت نظر', 'error');
				return;
			}

			// Network or server error: store in pending queue in localStorage for retry
			try {
				const entry = {
					id: Date.now(),
					name,
					text,
					reply: null,
					date: new Date().toLocaleDateString("fa-IR"),
					visible: false,
				};
				const pending = JSON.parse(localStorage.getItem("pendingReviews") || "[]");
				pending.push(entry);
				localStorage.setItem("pendingReviews", JSON.stringify(pending));
			} catch (_) {
				// ignore localStorage errors
			}

			setLoading(false);
			form.reset();
			charCount.textContent = `۰ / ${MAX.toLocaleString("fa-IR")}`;
			showFeedback("اتصال به سرور برقرار نشد؛ نظر شما آفلاین ذخیره شد.", "success");
		}
	});

	// Attempt to sync pending reviews on load and when back online
	async function syncPending() {
		try {
			const pending = JSON.parse(localStorage.getItem("pendingReviews") || "[]");
			if (!Array.isArray(pending) || pending.length === 0) return;
			const remaining = [];
			for (const entry of pending) {
				try {
					await postReview({ name: entry.name, text: entry.text });
					// successful -> continue
				} catch (e) {
					// if client error (but not rate limit), drop it; otherwise keep for later
					if (e && e.status && e.status >= 400 && e.status < 500 && e.status !== 429) {
						// don't retry bad entries
						continue;
					}
					remaining.push(entry);
				}
			}
			if (remaining.length === 0) {
				localStorage.removeItem("pendingReviews");
				showFeedback('نظرات آفلاین با موفقیت همگام‌سازی شدند.', 'success');
			} else {
				localStorage.setItem("pendingReviews", JSON.stringify(remaining));
			}
		} catch (e) { /* ignore sync errors */ }
	}

	// run sync once on init
	syncPending();
	// try again when browser regains network
	window.addEventListener('online', () => { syncPending(); });

	// Helpers 
	function setLoading(on) {
		if (!submitBtn) return;
		submitBtn.disabled = on;
		submitBtn.classList.toggle("submit-btn--loading", on);
	}

	function showFeedback(message, type) {
		if (!feedback) return;
		feedback.textContent = message;
		feedback.className = `form-feedback form-feedback--${type} form-feedback--visible`;
		setTimeout(() => {
			feedback.classList.remove("form-feedback--visible");
		}, 4500);
	}
}
