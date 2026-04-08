import { apiSuccess, parseJsonBody, withApiHandler } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { createSeriesSchema } from "@/lib/server/books-schemas";
import { createSeries, listSeries } from "@/lib/server/catalog-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireSession();
  const series = await listSeries();

  return apiSuccess(series);
});

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, createSeriesSchema);
  const createdSeries = await createSeries(payload.name, payload.totalVolumes);

  return apiSuccess(createdSeries, 201);
});
