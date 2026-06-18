import { reviews } from "./mock-state.js";
import { createExchange } from "../../../components/messages/messages.js";

const VISIBLE = reviews.filter((r) => r.visible);
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

	VISIBLE.forEach((_, i) => {
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
	if (isAnimating || VISIBLE.length === 0) return;
	isAnimating = true;

	const container = document.getElementById("chat-messages");
	const outgoing = container.querySelector(".msg-exchange");
	const incoming = createExchange(VISIBLE[nextIndex]);

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
	transition((currentIndex + 1) % VISIBLE.length, "next");
}

function goPrev() {
	transition((currentIndex - 1 + VISIBLE.length) % VISIBLE.length, "prev");
}

function goTo(index) {
	if (index === currentIndex || isAnimating) return;
	transition(index, index > currentIndex ? "next" : "prev");
	resetTimer();
}

// Timer
function startTimer() {
	stopTimer();
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
export function initChatPlayer() {
	if (VISIBLE.length === 0) return;

	initDots();

	// First message: no animation, just render
	const container = document.getElementById("chat-messages");
	container.appendChild(createExchange(VISIBLE[0]));

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
