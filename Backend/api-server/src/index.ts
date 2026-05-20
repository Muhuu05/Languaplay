import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  logger.info(`🚀 API Server running on http://localhost:${PORT}`);
});
