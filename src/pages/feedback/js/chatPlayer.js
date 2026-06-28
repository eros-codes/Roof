import { fetchReviews } from "./api.js";
import { createExchange } from "../../../components/messages/messages.js";

let reviewsCache = [];
function getVisible() {
	return reviewsCache;
}
const DURATION = 4000; // ms between auto-advances
const ANIM_MS = 450;   // must match CSS animation duration

let currentIndex = 0;
let isPaused = false;
let timer = null;
let isAnimating = false;

// Dot indicators
function initDots() {
	const container = document.getElementById("chat-dots");
	if (!container) return;
	container.innerHTML = "";

	getVisible().forEach((_, i) => {
		const btn = document.createElement("button");
		btn.classList.add("chat-dot");
		if (i === 0) btn.classList.add("chat-dot--active");
		btn.setAttribute("aria-label", `نظر ${i + 1}`);
		btn.addEventListener("click", () => goTo(i));
		container.appendChild(btn);
	});
}

function updateDots(index) {
	document.querySelectorAll(".chat-dot").forEach((dot, i) => {
		dot.classList.toggle("chat-dot--active", i === index);
	});
	
}

// Transition
function transition(nextIndex, dir = "next") {
	if (isAnimating || getVisible().length === 0) return;
	isAnimating = true;

	const container = document.getElementById("chat-messages");
	const outgoing = container.querySelector(".msg-exchange");
	const incoming = createExchange(getVisible()[nextIndex]);

	incoming.classList.add(dir === "next" ? "msg--enter-bottom" : "msg--enter-top");
	container.appendChild(incoming);

	if (outgoing) {
		outgoing.classList.add(dir === "next" ? "msg--exit-top" : "msg--exit-bottom");
	}

	setTimeout(() => {
		outgoing?.remove();
		incoming.classList.remove("msg--enter-bottom", "msg--enter-top");
		currentIndex = nextIndex;
		updateDots(currentIndex);
		isAnimating = false;
	}, ANIM_MS);
}

function goNext() {
	const len = getVisible().length;
	if (len <= 1) return;
	transition((currentIndex + 1) % len, "next");
}

function goPrev() {
	const len = getVisible().length;
	if (len <= 1) return;
	transition((currentIndex - 1 + len) % len, "prev");
}

function goTo(index) {
	if (index === currentIndex || isAnimating) return;
	transition(index, index > currentIndex ? "next" : "prev");
	resetTimer();
}

// Timer
function startTimer() {
	stopTimer();
	if (getVisible().length <= 1) return; // nothing to rotate
	timer = setInterval(goNext, DURATION);
}

function stopTimer() {
	if (timer) clearInterval(timer);
	timer = null;
}

function resetTimer() {
	if (!isPaused) startTimer();
}

// Pause button
function syncPauseBtn() {
	const btn = document.getElementById("pause-btn");
	if (!btn) return;
	const iconPause = btn.querySelector(".icon-pause");
	const iconPlay = btn.querySelector(".icon-play");
	if (iconPause) iconPause.style.display = isPaused ? "none" : "block";
	if (iconPlay)  iconPlay.style.display  = isPaused ? "block" : "none";
	btn.setAttribute("aria-label", isPaused ? "پخش" : "توقف");
}

// Public init
export async function initChatPlayer() {
	try {
		const res = await fetchReviews();
		// Backend returns {data, page, limit, total} when ?limit/?page is sent, or a plain array otherwise.
		const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
		// Map createdAt -> date (localized) for compatibility with createExchange
		reviewsCache = list.map((r) => ({ ...r, date: r.createdAt ? new Date(r.createdAt).toLocaleDateString("fa-IR") : null }));
	} catch (e) {
		console.error("Failed to load reviews:", e);
		reviewsCache = [];
	}

	const visible = getVisible();
	const container = document.getElementById("chat-messages");
	const chatWindow = document.querySelector(".chat-window");
	const chatContainer = document.querySelector(".chat-container");
	const chatControls = document.querySelector(".chat-controls");
	const chatDots = document.getElementById("chat-dots");

	// Empty state: show a short placeholder and hide controls/dots
	if (visible.length === 0) {
		if (chatContainer) chatContainer.classList.add("chat-container--empty");
		if (chatWindow) chatWindow.classList.add("chat-window--empty");
		if (chatControls) chatControls.style.display = "none";
		if (chatDots) chatDots.style.display = "none";

		if (container) {
			container.innerHTML = "";
			const placeholder = document.createElement("div");
			placeholder.classList.add("chat-placeholder");
			const title = document.createElement("p");
			title.classList.add("chat-placeholder-title");
			title.textContent = "هنوز نظری ثبت نشده";
			const body = document.createElement("p");
			body.classList.add("chat-placeholder-body");
			body.textContent = "اولین نفر باشید و تجربه‌تان را با ما به اشتراک بگذارید";
			placeholder.appendChild(title);
			placeholder.appendChild(body);
			container.appendChild(placeholder);
		}

		return;
	}

	// Ensure any previous empty state is cleared
	if (chatContainer) chatContainer.classList.remove("chat-container--empty");
	if (chatWindow) chatWindow.classList.remove("chat-window--empty");
	if (chatControls) chatControls.style.display = "";
	if (chatDots) chatDots.style.display = "";

	initDots();

	// First message: no animation, just render
	if (container) container.appendChild(createExchange(visible[0]));

	startTimer();

	document.getElementById("next-btn")?.addEventListener("click", () => {
		goNext();
		resetTimer();
	});

	document.getElementById("prev-btn")?.addEventListener("click", () => {
		goPrev();
		resetTimer();
	});

	document.getElementById("pause-btn")?.addEventListener("click", () => {
		isPaused = !isPaused;
		isPaused ? stopTimer() : startTimer();
		syncPauseBtn();
	});
}
