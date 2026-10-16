export interface ApiResponse<T = any> {
  status: string;
  message: string;
  data: T;
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

export interface ApiOptions {
  method?: string;
  body?: unknown;
  form?: FormData;
  auth?: boolean;
}

const ACCESS_TOKEN_KEY = "access_token";

// Jalur utama: proxy same-origin (src/routes/api/[...path]/+server.ts),
// sehingga browser tidak melakukan CORS ke Delcom Open API.
const API_PATH = "/api";

// Status gerbang yang menandakan server di belakang proxy sedang bermasalah.
const GATEWAY_ERRORS = [502, 503, 504];

export const getAccessToken = (): string | null =>
  localStorage.getItem(ACCESS_TOKEN_KEY);

export const putAccessToken = (token: string): void =>
  localStorage.setItem(ACCESS_TOKEN_KEY, token);

export const removeAccessToken = (): void =>
  localStorage.removeItem(ACCESS_TOKEN_KEY);

/** Respons API dianggap berhasil bila status bernilai "success". */
export const isSuccess = (response: ApiResponse): boolean =>
  response.status === "success";

export const toResult = (response: ApiResponse): ActionResult => ({
  ok: isSuccess(response),
  message: response.message,
});

interface Attempt<T> {
  data: ApiResponse<T>;
  gatewayError: boolean;
}

async function send<T>(url: string, init: RequestInit): Promise<Attempt<T>> {
  const response = await fetch(url, init);
  return {
    data: await response.json(),
    gatewayError: GATEWAY_ERRORS.includes(response.status),
  };
}

/**
 * Pembungkus fetch ke Delcom Open API.
 * Header otorisasi: Authorization: Bearer <token>.
 * Permintaan dicoba lewat proxy `/api` lebih dulu; bila proxy gagal
 * (galat jaringan, balasan bukan JSON, atau status 502/503/504),
 * permintaan diulang langsung ke Delcom Open API.
 */
export async function apiFetch<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, form, auth = true } = options;
  const headers: Record<string, string> = {};
  const token = getAccessToken();

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const init: RequestInit = { method, headers, body: payload };

  try {
    const proxied = await send<T>(`${API_PATH}${path}`, init);
    if (!proxied.gatewayError) {
      return proxied.data;
    }
  } catch {
    // Proxy tidak tersedia atau membalas non-JSON: lanjut ke jalur cadangan.
  }

  try {
    return (await send<T>(`${DELCOM_BASEURL}${path}`, init)).data;
  } catch {
    return {
      status: "error",
      message: "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      data: null as T,
    };
  }
}