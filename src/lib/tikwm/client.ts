import { ApiError } from "@/src/lib/api/errors";

const TIKWM_BASE_URL = "https://tikwm.com";

export type TikwmPostOptions = {
  path: string;
  body: unknown;
  signal?: AbortSignal;
};

export async function tikwmPostJson(options: TikwmPostOptions): Promise<unknown> {
  const url = new URL(options.path, TIKWM_BASE_URL);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(options.body),
      signal: options.signal,
      cache: "no-store",
    });
  } catch (cause) {
    throw new ApiError({
      code: "UPSTREAM_ERROR",
      message: "TikWM request failed.",
      status: 502,
      details: cause,
    });
  }

  if (!response.ok) {
    throw new ApiError({
      code: "UPSTREAM_ERROR",
      message: `TikWM returned HTTP ${response.status}.`,
      status: 502,
    });
  }

  const json = (await response.json().catch(() => null)) as unknown;
  if (!json) {
    throw new ApiError({
      code: "UPSTREAM_ERROR",
      message: "TikWM returned invalid JSON.",
      status: 502,
    });
  }

  return json;
}

