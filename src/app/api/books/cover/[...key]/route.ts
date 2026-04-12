import { ApiError, withApiHandler } from "@/server/api";
import { readCoverFromR2 } from "@/server/r2";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(
  async (_request: Request, { params }: { params: Promise<{ key: string[] }> }) => {
    const { key: rawKeyParts } = await params;
    const keyParts = Array.isArray(rawKeyParts) ? rawKeyParts : [];
    const key = keyParts.map((segment) => decodeURIComponent(segment)).join("/");

    // Path traversal protection
    if (key.includes("..") || key.includes("//")) {
      throw new ApiError(400, "Invalid cover key.");
    }

    const cover = await readCoverFromR2(key);

    const headers = new Headers({
      "Content-Type": cover.contentType,
      "Cache-Control": cover.cacheControl
    });

    if (cover.etag) {
      headers.set("ETag", cover.etag);
    }

    return new Response(Buffer.from(cover.bytes), {
      status: 200,
      headers
    });
  }
);
