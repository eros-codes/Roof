const IMAGE_BASE = new URL(
	"../../../public/assets/images/products/",
	import.meta.url,
);

export function createCard({ id, name, description, price, image }) {
	const card = document.createElement("section");
	card.classList.add("food-card");
	card.dataset.productId = id;

	const picDiv = document.createElement("div");
	picDiv.classList.add("food-pic");
	if (image && image !== 'placeholder.png') {
		const img = document.createElement("img");
		img.src = new URL(image, IMAGE_BASE).href;
		img.alt = name;
		picDiv.appendChild(img);
	} else {
		const placeholder = document.createElement('div');
		placeholder.className = 'food-pic--empty';
		placeholder.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
		picDiv.appendChild(placeholder);
	}

	const infoDiv = document.createElement("div");
	infoDiv.classList.add("food-info");

	const tagDiv = document.createElement("div");
	tagDiv.classList.add("food-tag");
	const nameH3 = document.createElement("h3");
	nameH3.classList.add("food-name");
	nameH3.textContent = name;
	const priceDiv = document.createElement("div");
	priceDiv.classList.add("food-price");
	priceDiv.textContent = `${price.toLocaleString("fa-IR")} تومان`;

	tagDiv.appendChild(nameH3);
	tagDiv.appendChild(priceDiv);
	infoDiv.appendChild(tagDiv);

	const descP = document.createElement("p");
	descP.classList.add("food-description");
	descP.textContent = description;
	infoDiv.appendChild(descP);

	card.appendChild(picDiv);
	card.appendChild(infoDiv);

	return card;
}
