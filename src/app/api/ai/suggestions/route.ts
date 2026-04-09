import { apiSuccess, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { getLatestAiSuggestion } from "@/server/ai-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireSession();
  const suggestion = await getLatestAiSuggestion();

  return apiSuccess({ suggestion });
});
