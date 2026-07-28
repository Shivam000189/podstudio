import dotenv from "dotenv";

dotenv.config();

const parseOrigins = (value?: string) =>
  value
    ?.split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean) ?? [];

const corsOriginEnv =
  process.env.CORS_ORIGINS ??
  process.env.CORS_ORIGIN ??
  process.env.FRONTEND_URL ??
  process.env.CLIENT_URL;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),
  corsOrigins: parseOrigins(corsOriginEnv),
};

export const isProduction = env.nodeEnv === "production";
