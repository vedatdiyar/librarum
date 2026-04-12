import { NextResponse } from "next/server";
import { apiSuccess, withApiHandler } from "@/server/api";
import { requireSession } from "@/server/auth";
import { getStatsSnapshot } from "@/server/stats-service";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireSession();
  const stats = await getStatsSnapshot();

  return NextResponse.json(stats, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
    }
  });
});
