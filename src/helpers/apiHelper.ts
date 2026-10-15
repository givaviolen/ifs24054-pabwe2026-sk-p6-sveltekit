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

/**
 * Pembungkus fetch ke Delcom Open API.
 * Header otorisasi: Authorization: Bearer <token>.
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

  try {
    const response = await fetch(`${DELCOM_BASEURL}${path}`, {
      method,
      headers,
      body: payload,
    });
    return await response.json();
  } catch {
    return {
      status: "error",
      message: "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      data: null as T,
    };
  }
}
