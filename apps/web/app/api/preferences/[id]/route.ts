import { apiMessage, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { deletePreference } from "@/lib/server/preferences-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

import { uuidSchema } from "@/lib/server/books-schemas";
type PreferenceRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const DELETE = withApiHandler(
  async (_request: Request, context: PreferenceRouteContext) => {
    await requireSession();
    const { id } = await context.params;
    const prefId = uuidSchema.parse(id);
    await deletePreference(prefId);

    return apiMessage("Preference deleted.");
  }
);
