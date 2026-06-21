import express from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ALLOWED_ORIGINS } from "./config/env.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: "20kb" }));

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);

export default app;
