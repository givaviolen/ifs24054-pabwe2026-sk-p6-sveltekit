
import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fail, makeFile, ok, resetStores, testUser } from "../../../test-utils";
import { refreshProfile } from "../../auth/states/authStore";
import { fetchUsers, postPhoto, putPassword, putProfile } from "../api/userApi";
import {
  loadUsers,
  profileBusy,
  savePassword,
  savePhoto,
  saveProfile,
  users,
  usersLoading,
} from "./usersStore";

vi.mock("../api/userApi", () => ({
  fetchUsers: vi.fn(),
  postPhoto: vi.fn(),
  putPassword: vi.fn(),
  putProfile: vi.fn(),
}));

// Mempertahankan seluruh ekspor asli authStore,
// termasuk token, profile, dan isLoggedIn.
vi.mock("../../auth/states/authStore", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../auth/states/authStore")>();

  return {
    ...actual,
    refreshProfile: vi.fn().mockResolvedValue(undefined),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  resetStores();
});

describe("loadUsers", () => {
  it("mengisi daftar pengguna bila berhasil", async () => {
    vi.mocked(fetchUsers).mockResolvedValue(ok({ users: [testUser] }));

    const result = await loadUsers();

    expect(result.ok).toBe(true);
    expect(get(users)).toEqual([testUser]);
    expect(get(usersLoading)).toBe(false);
  });

  it("membiarkan daftar bila gagal", async () => {
    vi.mocked(fetchUsers).mockResolvedValue(fail("Tidak ada akses"));

    const result = await loadUsers();

    expect(result).toEqual({
      ok: false,
      message: "Tidak ada akses",
    });
    expect(get(users)).toEqual([]);
  });
});

describe("mutasi profil", () => {
  it("saveProfile memuat ulang profil setelah berhasil", async () => {
    vi.mocked(putProfile).mockResolvedValue(ok(null, "Profil diubah"));

    const result = await saveProfile({
      name: "A",
      email: "a@b.c",
    });

    expect(result).toEqual({
      ok: true,
      message: "Profil diubah",
    });
    expect(refreshProfile).toHaveBeenCalledTimes(1);
    expect(get(profileBusy)).toBe(false);
  });

  it("saveProfile tidak memuat ulang profil bila gagal", async () => {
    vi.mocked(putProfile).mockResolvedValue(fail("Email dipakai"));

    const result = await saveProfile({
      name: "A",
      email: "a@b.c",
    });

    expect(result.ok).toBe(false);
    expect(refreshProfile).not.toHaveBeenCalled();
  });

  it("savePhoto memuat ulang profil setelah berhasil", async () => {
    vi.mocked(postPhoto).mockResolvedValue(ok());

    const file = makeFile();

    await savePhoto(file);

    expect(postPhoto).toHaveBeenCalledWith(file);
    expect(refreshProfile).toHaveBeenCalledTimes(1);
  });

  it("savePassword tidak memuat ulang profil", async () => {
    vi.mocked(putPassword).mockResolvedValue(ok());

    const result = await savePassword({
      password: "lama",
      new_password: "baru",
    });

    expect(result.ok).toBe(true);
    expect(refreshProfile).not.toHaveBeenCalled();
  });

  it("menyalakan penanda sibuk selama permintaan berjalan", async () => {
    let finish: (value: unknown) => void = () => {};

    vi.mocked(putPassword).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }) as any,
    );

    const pending = savePassword({
      password: "a",
      new_password: "b",
    });

    expect(get(profileBusy)).toBe(true);

    finish(ok());

    await pending;

    expect(get(profileBusy)).toBe(false);
  });
});
