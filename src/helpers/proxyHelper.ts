// Meneruskan permintaan dari browser ke Delcom Open API lewat server aplikasi.
// Browser hanya berbicara ke origin yang sama, jadi tidak ada permintaan CORS
// (termasuk peringatan "Authorization tidak tercakup wildcard *").

const FORWARDED_REQUEST_HEADERS = ["authorization", "content-type"];

const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

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
    const upstream = await fetch(`${DELCOM_BASEURL}/${path}${search}`, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
    });

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