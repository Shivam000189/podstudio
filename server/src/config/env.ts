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
  jwtSecret:
    process.env.JWT_SECRET ??
    (process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error("JWT_SECRET must be defined in production");
        })()
      : "riverside-development-secret"),
  guestJwtSecret:
    process.env.GUEST_JWT_SECRET ??
    (process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error("GUEST_JWT_SECRET must be defined in production");
        })()
      : "riverside-guest-dev-secret"),

  // SMTP / Email
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? "PodStudio <noreply@podstudio.app>",

  // OTP tuning
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES ?? 5),
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 5),
};

export const isProduction = env.nodeEnv === "production";

