import { apiSuccess, parseJsonBody, parseSearchParams, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { createSeriesSchema, paginationQuerySchema } from "@/server/books-schemas";
import { createSeries, listSeries } from "@/server/catalog-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (request: Request) => {
  await requireSession();
  const query = parseSearchParams(request, paginationQuerySchema);
  const result = await listSeries(query.page, query.limit);

  return apiSuccess(result);
});

export const POST = withApiHandler(async (request: Request) => {
  await requireSession();
  const payload = await parseJsonBody(request, createSeriesSchema);
  const createdSeries = await createSeries(payload.name, payload.totalVolumes);

  return apiSuccess(createdSeries, 201);
});
