import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { listPreferences, addPreference } from "@/server/preferences-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const addPreferenceSchema = z.object({
  type: z.enum(["author", "category"]),
  value: z.string().min(1)
});

export const GET = withApiHandler(async () => {
  const session = await requireSession();
  const prefs = await listPreferences(session.user.id);
  return apiSuccess(prefs);
});

export const POST = withApiHandler(async (request: Request) => {
  const session = await requireSession();
  const payload = await parseJsonBody(request, addPreferenceSchema);
  const pref = await addPreference(session.user.id, payload.type, payload.value);
  return apiSuccess(pref, 201);
});
