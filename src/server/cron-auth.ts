import { ApiError } from "@/server/api";

export function assertCronAuthorized(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    throw new Error("CRON_SECRET is not set.");
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token || token !== expectedSecret) {
    throw new ApiError(401, "Unauthorized cron request.");
  }
}
