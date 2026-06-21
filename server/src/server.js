import "dotenv/config";
import app from "./app.js";
import { PORT, ADMIN_ORIGIN } from "./config/env.js";

app.listen(PORT, () => {
	console.log(`✅ Server: http://localhost:${PORT}`);
	console.log(`📡 API:    http://localhost:${PORT}/api`);
	console.log(`🔒 Admin UI should be served on: ${ADMIN_ORIGIN} (run admin proxy)`);
});
