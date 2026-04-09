import { parseJsonBody, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { aiChatRequestSchema } from "@/server/ai-schemas";
import { createManualChatStream } from "@/server/ai-service";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, aiChatRequestSchema);
  const stream = await createManualChatStream(payload.message);

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
});
