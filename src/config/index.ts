export const config = {
  port: process.env.PORT || 3000,
  env: process.env.ENVIRONMENT || "development",
  db: {
    // Database configuration can be added here if needed
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  },
};

export const isDevelopment = config.env === "development";
export const isProduction = config.env === "production";
