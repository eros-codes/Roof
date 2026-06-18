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
	form.addEventListener("submit", (e) => {
		e.preventDefault();

		const name = form.querySelector("#review-name")?.value.trim() || null;
		const text = textarea.value.trim();

		if (!text) {
			showFeedback("لطفاً نظر خود را وارد کنید.", "error");
			textarea.focus();
			return;
		}

		const entry = {
			id: Date.now(),
			name,
			text,
			reply: null,
			date: new Date().toLocaleDateString("fa-IR"),
			visible: false, // shown only after admin approval
		};

		// Persist to localStorage (pending queue)
		try {
			const pending = JSON.parse(localStorage.getItem("pendingReviews") || "[]");
			pending.push(entry);
			localStorage.setItem("pendingReviews", JSON.stringify(pending));
		} catch (_) {
			// localStorage unavailable — silent fail
		}

		setLoading(true);

		setTimeout(() => {
			setLoading(false);
			form.reset();
			charCount.textContent = `۰ / ${MAX.toLocaleString("fa-IR")}`;
			showFeedback("نظر شما ثبت شد 🙏", "success");
		}, 700);
	});

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
