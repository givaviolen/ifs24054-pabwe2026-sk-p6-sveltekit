import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxyRequest } from "./proxyHelper";

const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const gatewayRes = () =>
  new Response("<h1>502 Bad Gateway</h1>", {
    status: 502,
    headers: { "content-type": "text/html" },
  });

function stubFetch() {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// Menjalankan proxy sambil memajukan timer palsu (jeda antar percobaan ulang).
async function run(request: Request, path: string, search = "") {
  const promise = proxyRequest(request, path, search);
  await vi.runAllTimersAsync();
  return promise;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("proxyRequest", () => {
  it("GET: meneruskan Authorization dan query tanpa body", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValue(jsonRes({ status: "success" }));
    const request = new Request("http://localhost/api/courses?is_me=1", {
      method: "GET",
      headers: { Authorization: "Bearer tok", Cookie: "rahasia=1" },
    });

    const response = await run(request, "courses", "?is_me=1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${DELCOM_BASEURL}/courses?is_me=1`);
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect(init.headers.get("accept")).toBe("application/json");
    expect(init.headers.get("authorization")).toBe("Bearer tok");
    expect(init.headers.get("content-type")).toBeNull();
    expect(init.headers.get("cookie")).toBeNull();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({ status: "success" });
  });

  it("POST: meneruskan Content-Type dan body", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValue(jsonRes({ status: "fail" }, 400));
    const request = new Request("http://localhost/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    const response = await run(request, "courses");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${DELCOM_BASEURL}/courses`);
    expect(init.method).toBe("POST");
    expect(init.body.byteLength).toBe(2);
    expect(init.headers.get("content-type")).toBe("application/json");
    expect(init.headers.get("authorization")).toBeNull();
    expect(response.status).toBe(400);
  });

  it("memakai application/json bila respons asal tanpa Content-Type", async () => {
    stubFetch().mockResolvedValue(new Response(null, { status: 204 }));
    const request = new Request("http://localhost/api/courses/1", {
      method: "DELETE",
    });

    const response = await run(request, "courses/1");

    expect(response.status).toBe(204);
    expect(response.headers.get("content-type")).toBe("application/json");
  });

  it("tidak mengulang bila server menjawab galat biasa (mis. 401)", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockResolvedValue(jsonRes({ status: "fail" }, 401));

    const response = await run(
      new Request("http://localhost/api/users/me"),
      "users/me",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(401);
  });

  it("mengulang saat 502 lalu berhasil pada percobaan berikutnya", async () => {
    const fetchMock = stubFetch();
    fetchMock
      .mockResolvedValueOnce(gatewayRes())
      .mockResolvedValueOnce(gatewayRes())
      .mockResolvedValueOnce(jsonRes({ status: "success" }));

    const response = await run(
      new Request("http://localhost/api/users/me"),
      "users/me",
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "success" });
  });

  it("mengubah balasan non-JSON menjadi JSON setelah percobaan habis", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockImplementation(() => Promise.resolve(gatewayRes()));

    const response = await run(
      new Request("http://localhost/api/users/me"),
      "users/me",
    );

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).toBe("application/json");
    const body = await response.json();
    expect(body.status).toBe("fail");
    expect(body.message).toContain("502");
  });

  it("mengulang saat koneksi putus lalu berhasil", async () => {
    const fetchMock = stubFetch();
    fetchMock
      .mockRejectedValueOnce(new Error("putus"))
      .mockResolvedValueOnce(jsonRes({ status: "success" }));

    const response = await run(
      new Request("http://localhost/api/users/me"),
      "users/me",
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
  });

  it("mengubah kegagalan jaringan menjadi respons 502 setelah percobaan habis", async () => {
    const fetchMock = stubFetch();
    fetchMock.mockRejectedValue(new Error("offline"));

    const response = await run(
      new Request("http://localhost/api/courses"),
      "courses",
    );

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.status).toBe("fail");
    expect(body.message).toMatch(/terhubung/i);
  });
});