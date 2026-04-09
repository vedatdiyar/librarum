import { apiSuccess, withApiHandler } from "@/server/api";
import { assertCronAuthorized, regenerateMonthlyAiSuggestion } from "@/server/ai-service";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request: Request) => {
  assertCronAuthorized(request);
  const suggestion = await regenerateMonthlyAiSuggestion();

  return apiSuccess({ suggestion });
});
