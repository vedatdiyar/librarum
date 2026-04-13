import { timingSafeEqual } from "crypto";
import { ApiError } from "@/server/api";

export function assertCronAuthorized(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    throw new Error("CRON_SECRET is not set.");
  }

  // 1. Check for Vercel Cron header (Origin verification)
  // Skip this check on localhost for easier development
  const isDev = process.env.NODE_ENV === "development";
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (!isDev && !isVercelCron) {
    throw new ApiError(403, "Invalid cron origin.");
  }

  // 2. Check for Authorization header (Bearer token)
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    throw new ApiError(401, "Unauthorized cron request.");
  }

  // Use constant-time comparison to prevent timing attacks
  const tokenBuffer = Buffer.from(token, "utf8");
  const secretBuffer = Buffer.from(expectedSecret, "utf8");

  // Pad to same length if different (will always fail for mismatched lengths, but safely)
  if (tokenBuffer.length !== secretBuffer.length) {
    throw new ApiError(401, "Unauthorized cron request.");
  }

  if (!timingSafeEqual(tokenBuffer, secretBuffer)) {
    throw new ApiError(401, "Unauthorized cron request.");
  }
}
