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

const respond = (body: unknown) => ({ json: () => Promise.resolve(body) });

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

describe("apiFetch", () => {
  it("mengirim GET ke proxy /api dengan header Bearer bila token ada", async () => {
    putAccessToken("abc");
    fetchMock.mockResolvedValue(respond({ status: "success", message: "ok", data: 1 }));

    const result = await apiFetch("/courses");

    expect(fetchMock).toHaveBeenCalledWith("/api/courses", {
      method: "GET",
      headers: { Authorization: "Bearer abc" },
      body: undefined,
    });
    expect(result.data).toBe(1);
  });

  it("tidak mengirim Authorization bila token tidak ada", async () => {
    fetchMock.mockResolvedValue(respond({ status: "success", message: "", data: null }));

    await apiFetch("/courses");

    expect(fetchMock.mock.calls[0][1].headers).toEqual({});
  });

  it("tidak mengirim Authorization bila auth dimatikan", async () => {
    putAccessToken("abc");
    fetchMock.mockResolvedValue(respond({ status: "success", message: "", data: null }));

    await apiFetch("/auth/login", { auth: false });

    expect(fetchMock.mock.calls[0][1].headers).toEqual({});
  });

  it("mengirim body JSON beserta Content-Type", async () => {
    fetchMock.mockResolvedValue(respond({ status: "success", message: "", data: null }));

    await apiFetch("/courses", { method: "POST", body: { title: "A" } });

    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ title: "A" }));
  });

  it("mengirim FormData tanpa Content-Type", async () => {
    fetchMock.mockResolvedValue(respond({ status: "success", message: "", data: null }));
    const form = new FormData();

    await apiFetch("/courses/1/cover", { method: "POST", form });

    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBe(form);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("mengembalikan respons galat bila fetch gagal", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    const result = await apiFetch("/courses");

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/terhubung/i);
    expect(result.data).toBeNull();
  });

  it("mengembalikan respons galat bila isi bukan JSON", async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.reject(new Error("bukan json")) });

    const result = await apiFetch("/courses");

    expect(result.status).toBe("error");
  });
});