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
  const seriesId = uuidSchema.parse(id);
  const detail = await getSeriesDetail(seriesId);

  return apiSuccess(detail);
});

export const PATCH = withApiHandler(async (request: Request, context: SeriesRouteContext) => {
  await requireSession();
  const { id } = await context.params;
  const seriesId = uuidSchema.parse(id);
  const payload = await parseJsonBody(request, updateSeriesSchema);
  const updatedSeries = await updateSeries(
    seriesId,
    payload.name,
    payload.totalVolumes
  );

  return apiSuccess(updatedSeries);
});

export const DELETE = withApiHandler(async (_request: Request, context: SeriesRouteContext) => {
  await requireSession();
  const { id } = await context.params;
  const seriesId = uuidSchema.parse(id);
  await deleteSeries(seriesId);

  return apiMessage("Series deleted.");
});
