import { describe, expect, it, vi } from "vitest";
import { fallback } from "./api/[...path]/+server";

describe("api/[...path]/+server.ts", () => {
  it("meneruskan permintaan ke proxy Delcom", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "success" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("http://localhost/api/courses?is_me=1");

    const response = await (fallback as any)({
      request,
      params: { path: "courses" },
      url: new URL(request.url),
    });

    expect(fetchMock.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/courses?is_me=1`);
    expect(response.status).toBe(200);
  });
});