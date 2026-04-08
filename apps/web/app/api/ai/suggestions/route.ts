import { apiSuccess, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { getLatestAiSuggestion } from "@/lib/server/ai-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireSession();
  const suggestion = await getLatestAiSuggestion();

  return apiSuccess({ suggestion });
});
