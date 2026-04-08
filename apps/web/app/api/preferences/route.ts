import { apiSuccess, parseJsonBody, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { listPreferences, addPreference } from "@/lib/server/preferences-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const addPreferenceSchema = z.object({
  type: z.enum(["author", "category", "tag"]),
  value: z.string().min(1)
});

export const GET = withApiHandler(async () => {
  await requireSession();
  const prefs = await listPreferences();
  return apiSuccess(prefs);
});

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, addPreferenceSchema);
  const pref = await addPreference(payload.type, payload.value);
  return apiSuccess(pref, 201);
});
