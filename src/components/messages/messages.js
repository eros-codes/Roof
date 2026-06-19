/**
 * @param {{ text: string, name: string|null, date: string|null, variant: 'user'|'admin' }} opts
 */
function buildBubble({ text, name, date, variant }) {
	const row = document.createElement("div");
	row.classList.add("msg-row", `msg-row--${variant}`);

	const bubble = document.createElement("div");
	bubble.classList.add("msg-bubble", `msg-bubble--${variant}`);

	if (name) {
		const nameEl = document.createElement("span");
		nameEl.classList.add("msg-sender");
		nameEl.textContent = name;
		bubble.appendChild(nameEl);
	}

	const textEl = document.createElement("p");
	textEl.classList.add("msg-text");
	textEl.textContent = text;
	bubble.appendChild(textEl);

	if (date) {
		const meta = document.createElement("span");
		meta.classList.add("msg-meta");
		meta.textContent = date;
		bubble.appendChild(meta);
	}

	row.appendChild(bubble);
	return row;
}

/**
 * @param {{ name: string|null, text: string, reply: string|null, date: string }} review
 * @returns {HTMLDivElement}
 */
export function createExchange(review) {
	const wrap = document.createElement("div");
	wrap.classList.add("msg-exchange");

	wrap.appendChild(
		buildBubble({
			text: review.text,
			name: review.name,
			date: review.date,
			variant: "user",
		}),
	);

	if (review.reply) {
		wrap.appendChild(
			buildBubble({
				text: review.reply,
				name: "روف",
				date: null,
				variant: "admin",
			}),
		);
	}

	return wrap;
}
