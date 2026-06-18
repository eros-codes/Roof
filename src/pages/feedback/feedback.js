import { initChatPlayer } from "./js/chatPlayer.js";
import { initForm } from "./js/form.js";
import { initMobileDrawer } from "../../../public/assets/js/main.js";

document.addEventListener("DOMContentLoaded", () => {
	initChatPlayer();
	initForm();
	initMobileDrawer();
});