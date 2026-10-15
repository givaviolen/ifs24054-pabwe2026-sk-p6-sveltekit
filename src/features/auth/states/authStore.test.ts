import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAccessToken, putAccessToken } from "../../../helpers/apiHelper";
import { fail, ok, resetStores, testUser } from "../../../test-utils";
import { fetchMe, loginRequest, registerRequest } from "../api/authApi";
import {
  authLoading,
  isLoggedIn,
  login,
  logout,
  profile,
  refreshProfile,
  register,
  restoreSession,
  sessionReady,
  token,
} from "./authStore";

vi.mock("../api/authApi", () => ({
  fetchMe: vi.fn(),
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
}));

beforeEach(() => {
  resetStores();
});

describe("restoreSession", () => {
  it("menandai sesi siap tanpa memanggil API bila tidak ada token", async () => {
    await restoreSession();
    expect(fetchMe).not.toHaveBeenCalled();
    expect(get(sessionReady)).toBe(true);
    expect(get(isLoggedIn)).toBe(false);
  });

  it("memulihkan sesi bila token valid", async () => {
    putAccessToken("tok");
    vi.mocked(fetchMe).mockResolvedValue(ok({ user: testUser }));

    await restoreSession();

    expect(get(token)).toBe("tok");
    expect(get(profile)).toEqual(testUser);
    expect(get(isLoggedIn)).toBe(true);
    expect(get(sessionReady)).toBe(true);
  });

  it("menghapus token bila profil gagal dimuat", async () => {
    putAccessToken("tok");
    vi.mocked(fetchMe).mockResolvedValue(fail());

    await restoreSession();

    expect(getAccessToken()).toBeNull();
    expect(get(isLoggedIn)).toBe(false);
    expect(get(sessionReady)).toBe(true);
  });
});

describe("login", () => {
  it("gagal bila kredensial salah", async () => {
    vi.mocked(loginRequest).mockResolvedValue(fail("Kredensial salah"));

    const result = await login({ email: "a@b.c", password: "x" });

    expect(result).toEqual({ ok: false, message: "Kredensial salah" });
    expect(get(authLoading)).toBe(false);
    expect(fetchMe).not.toHaveBeenCalled();
  });

  it("gagal dan menghapus token bila profil tidak bisa dimuat", async () => {
    vi.mocked(loginRequest).mockResolvedValue(ok({ token: "tok" }));
    vi.mocked(fetchMe).mockResolvedValue(fail("Profil gagal"));

    const result = await login({ email: "a@b.c", password: "x" });

    expect(result).toEqual({ ok: false, message: "Profil gagal" });
    expect(getAccessToken()).toBeNull();
    expect(get(isLoggedIn)).toBe(false);
  });

  it("berhasil menyimpan token, profil, dan status login", async () => {
    vi.mocked(loginRequest).mockResolvedValue(ok({ token: "tok" }, "Login berhasil"));
    vi.mocked(fetchMe).mockResolvedValue(ok({ user: testUser }));

    const result = await login({ email: "a@b.c", password: "x" });

    expect(result).toEqual({ ok: true, message: "Login berhasil" });
    expect(getAccessToken()).toBe("tok");
    expect(get(token)).toBe("tok");
    expect(get(profile)).toEqual(testUser);
    expect(get(isLoggedIn)).toBe(true);
    expect(get(authLoading)).toBe(false);
  });
});

describe("register", () => {
  it("mengembalikan hasil sukses", async () => {
    vi.mocked(registerRequest).mockResolvedValue(ok(null, "Terdaftar"));
    expect(await register({ name: "A", email: "a@b.c", password: "1" })).toEqual({
      ok: true,
      message: "Terdaftar",
    });
    expect(get(authLoading)).toBe(false);
  });

  it("mengembalikan hasil gagal", async () => {
    vi.mocked(registerRequest).mockResolvedValue(fail("Email dipakai"));
    expect(await register({ name: "A", email: "a@b.c", password: "1" })).toEqual({
      ok: false,
      message: "Email dipakai",
    });
  });
});

describe("refreshProfile", () => {
  it("memperbarui profil bila berhasil", async () => {
    vi.mocked(fetchMe).mockResolvedValue(ok({ user: { ...testUser, name: "Baru" } }));
    await refreshProfile();
    expect(get(profile)?.name).toBe("Baru");
  });

  it("membiarkan profil bila gagal", async () => {
    profile.set(testUser);
    vi.mocked(fetchMe).mockResolvedValue(fail());
    await refreshProfile();
    expect(get(profile)).toEqual(testUser);
  });
});

describe("logout", () => {
  it("membersihkan token dan sesi", () => {
    putAccessToken("tok");
    token.set("tok");
    profile.set(testUser);
    isLoggedIn.set(true);

    logout();

    expect(getAccessToken()).toBeNull();
    expect(get(token)).toBeNull();
    expect(get(profile)).toBeNull();
    expect(get(isLoggedIn)).toBe(false);
  });
});
