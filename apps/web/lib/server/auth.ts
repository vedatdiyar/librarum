import { auth } from "@/auth";
import { ApiError } from "@/lib/server/api";

export async function requireSession() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new ApiError(401, "Authentication required.");
  }

  return session;
}
