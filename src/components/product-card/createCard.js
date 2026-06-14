export function createCard({ id, name, description, price, image }) {
	const card = document.createElement("section");
	card.classList.add("food-card");
	card.dataset.productId = id;

	const picDiv = document.createElement("div");
	picDiv.classList.add("food-pic");
	const img = document.createElement("img");
	img.src = "../../../public/assets/images/products/" + image;
	img.alt = name;
	picDiv.appendChild(img);

	const infoDiv = document.createElement("div");
	infoDiv.classList.add("food-info");

	const tagDiv = document.createElement("div");
	tagDiv.classList.add("food-tag");
	const nameH3 = document.createElement("h3");
	nameH3.classList.add("food-name");
	nameH3.textContent = name;
	const priceDiv = document.createElement("div");
	priceDiv.classList.add("food-price");
	priceDiv.textContent = `${price.toLocaleString()} تومان`;

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