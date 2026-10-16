import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiFetch,
  getAccessToken,
  isSuccess,
  putAccessToken,
  removeAccessToken,
  toResult,
} from "./apiHelper";

const fetchMock = vi.fn();

const respond = (body: unknown, status = 200) => ({
  status,
  json: () => Promise.resolve(body),
});

const ok = (data: unknown = null) =>
  respond({ status: "success", message: "ok", data });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("penyimpanan token", () => {
  it("menyimpan, membaca, dan menghapus token", () => {
    expect(getAccessToken()).toBeNull();
    putAccessToken("abc");
    expect(getAccessToken()).toBe("abc");
    removeAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});

describe("isSuccess dan toResult", () => {
  it("menilai status success sebagai berhasil", () => {
    expect(isSuccess({ status: "success", message: "", data: null })).toBe(true);
    expect(isSuccess({ status: "fail", message: "", data: null })).toBe(false);
  });

  it("mengubah respons menjadi hasil aksi", () => {
    expect(toResult({ status: "success", message: "Oke", data: null })).toEqual({
      ok: true,
      message: "Oke",
    });
    expect(toResult({ status: "fail", message: "Salah", data: null })).toEqual({
      ok: false,
      message: "Salah",
    });
  });
});

describe("apiFetch lewat proxy", () => {
  it("mengirim GET ke proxy /api dengan header Bearer bila token ada", async () => {
    putAccessToken("abc");
    fetchMock.mockResolvedValue(ok(1));

    const result = await apiFetch("/courses");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/courses", {
      method: "GET",
      headers: { Authorization: "Bearer abc" },
      body: undefined,
    });
    expect(result.data).toBe(1);
  });

  it("tidak mengirim Authorization bila token tidak ada", async () => {
    fetchMock.mockResolvedValue(ok());

    await apiFetch("/courses");

    expect(fetchMock.mock.calls[0][1].headers).toEqual({});
  });

  it("tidak mengirim Authorization bila auth dimatikan", async () => {
    putAccessToken("abc");
    fetchMock.mockResolvedValue(ok());

    await apiFetch("/auth/login", { auth: false });

    expect(fetchMock.mock.calls[0][1].headers).toEqual({});
  });

  it("mengirim body JSON beserta Content-Type", async () => {
    fetchMock.mockResolvedValue(ok());

    await apiFetch("/courses", { method: "POST", body: { title: "A" } });

    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ title: "A" }));
  });

  it("mengirim FormData tanpa Content-Type", async () => {
    fetchMock.mockResolvedValue(ok());
    const form = new FormData();

    await apiFetch("/courses/1/cover", { method: "POST", form });

    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBe(form);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("tidak beralih ke jalur cadangan untuk galat biasa (mis. 401)", async () => {
    fetchMock.mockResolvedValue(
      respond({ status: "fail", message: "Tidak terautentikasi", data: null }, 401)
    );

    const result = await apiFetch("/users/me");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("fail");
  });
});

describe("apiFetch jalur cadangan", () => {
  it("beralih langsung ke Delcom bila proxy melempar galat jaringan", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("proxy mati"))
      .mockResolvedValueOnce(ok(2));

    const result = await apiFetch("/courses");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/courses");
    expect(fetchMock.mock.calls[1][0]).toBe(`${DELCOM_BASEURL}/courses`);
    expect(result.data).toBe(2);
  });

  it("beralih langsung ke Delcom bila proxy membalas non-JSON", async () => {
    fetchMock
      .mockResolvedValueOnce({
        status: 404,
        json: () => Promise.reject(new Error("bukan json")),
      })
      .mockResolvedValueOnce(ok(3));

    const result = await apiFetch("/courses");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.data).toBe(3);
  });

  it("beralih langsung ke Delcom bila proxy membalas 502", async () => {
    fetchMock
      .mockResolvedValueOnce(
        respond({ status: "fail", message: "gerbang rusak", data: null }, 502)
      )
      .mockResolvedValueOnce(ok(4));

    const result = await apiFetch("/users/me");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(`${DELCOM_BASEURL}/users/me`);
    expect(result.data).toBe(4);
  });

  it("mengembalikan respons galat bila kedua jalur gagal", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    const result = await apiFetch("/courses");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.status).toBe("error");
    expect(result.message).toMatch(/terhubung/i);
    expect(result.data).toBeNull();
  });

  it("mengembalikan respons galat bila kedua jalur membalas non-JSON", async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      json: () => Promise.reject(new Error("bukan json")),
    });

    const result = await apiFetch("/courses");

    expect(result.status).toBe("error");
  });
});