import "dotenv/config";

import express from "express";
import cors from "cors";
import "./db";

import { config } from "./config";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import routes from "./routes";

const app = express();
const PORT = config.port;

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(requestLogger);

// Routes
app.use("/api", routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.env}`);
});
