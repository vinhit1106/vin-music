import { z } from "zod";
import { errorResponse, successResponse } from "@/src/lib/api/response";
import { ApiError } from "@/src/lib/api/errors";
import { resolveImportUrl } from "@/lib/tikwm/import-resolver";

const bodySchema = z.object({
  url: z.string().url("A valid TikTok URL is required."),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({
        code: "BAD_REQUEST",
        message: "A valid TikTok URL is required.",
        status: 400,
        details: parsed.error.flatten(),
      });
    }

    const { url } = parsed.data;

    // Accept both TikTok video links and music links
    const isTikTok =
      url.includes("tiktok.com") || url.includes("vm.tiktok");
    if (!isTikTok) {
      throw new ApiError({
        code: "BAD_REQUEST",
        message:
          "Only TikTok links are supported. Paste a link from tiktok.com or vm.tiktok.com.",
        status: 400,
      });
    }

    // Unified resolver: detects video vs music URL and calls correct TikWM endpoint
    const result = await resolveImportUrl(url);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
