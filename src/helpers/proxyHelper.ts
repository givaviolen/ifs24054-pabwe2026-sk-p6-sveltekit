// Meneruskan permintaan dari browser ke Delcom Open API lewat server aplikasi.
// Browser hanya berbicara ke origin yang sama, jadi tidak ada permintaan CORS
// (termasuk peringatan "Authorization tidak tercakup wildcard *").

const FORWARDED_REQUEST_HEADERS = ["authorization", "content-type"];

// Server Delcom kadang membalas 502/503/504 sesaat. Permintaan diulang
// beberapa kali agar gangguan singkat tidak membuat sesi pengguna terputus.
const GATEWAY_ERRORS = [502, 503, 504];
const RETRY_DELAYS_MS = [400, 1000, 2000];

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

async function fetchWithRetry(
  url: string,
  init: RequestInit,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const isLast = attempt === RETRY_DELAYS_MS.length;
    try {
      const response = await fetch(url, init);
      if (isLast || !GATEWAY_ERRORS.includes(response.status)) {
        return response;
      }
    } catch (error) {
      if (isLast) {
        throw error;
      }
    }
    await sleep(RETRY_DELAYS_MS[attempt]);
  }
}

export async function proxyRequest(
  request: Request,
  path: string,
  search: string,
): Promise<Response> {
  // Selalu minta JSON agar API tidak membalas dengan halaman HTML.
  const headers = new Headers({ accept: "application/json" });
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const upstream = await fetchWithRetry(
      `${DELCOM_BASEURL}/${path}${search}`,
      {
        method: request.method,
        headers,
        body: hasBody ? await request.arrayBuffer() : undefined,
      },
    );

    const contentType =
      upstream.headers.get("content-type") ?? "application/json";

    // Balasan non-JSON (mis. halaman error nginx) diubah menjadi JSON
    // supaya aplikasi menampilkan pesan yang jelas.
    if (!contentType.includes("json")) {
      return jsonResponse(
        {
          status: "fail",
          message: `Server Delcom tidak merespons dengan benar (HTTP ${upstream.status}).`,
        },
        upstream.status,
      );
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch {
    return jsonResponse(
      { status: "fail", message: "Tidak dapat terhubung ke server." },
      502,
    );
  }
}