import { apiMessage, apiSuccess, parseJsonBody, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { updateSeriesSchema, uuidSchema } from "@/server/books-schemas";
import { deleteSeries, getSeriesDetail, updateSeries } from "@/server/catalog-service";

export const dynamic = "force-dynamic";

type SeriesRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = withApiHandler(async (_request: Request, context: SeriesRouteContext) => {
  await requireSession();
  const { id } = await context.params;
  const detail = await getSeriesDetail(id);

  return apiSuccess(detail);
});

export const PATCH = withApiHandler(async (request: Request, context: SeriesRouteContext) => {
  await requireSession();
  const { id } = await context.params;
  const payload = await parseJsonBody(request, updateSeriesSchema);
  const updatedSeries = await updateSeries(
    id,
    payload.name,
    payload.totalVolumes
  );

  return apiSuccess(updatedSeries);
});

export const DELETE = withApiHandler(async (_request: Request, context: SeriesRouteContext) => {
  await requireSession();
  const { id } = await context.params;
  await deleteSeries(id);

  return apiMessage("Series deleted.");
});
