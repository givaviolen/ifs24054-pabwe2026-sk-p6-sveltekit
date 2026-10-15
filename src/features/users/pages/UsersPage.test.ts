import { render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deferred, fail, ok, resetStores, testUser, typeInto } from "../../../test-utils";
import { fetchUsers } from "../api/userApi";
import UsersPage from "./UsersPage.svelte";

vi.mock("../api/userApi", () => ({
  fetchUsers: vi.fn(),
  postPhoto: vi.fn(),
  putPassword: vi.fn(),
  putProfile: vi.fn(),
}));

const ayu = { ...testUser, photo: "https://img.test/ayu.png" };
const budi = { id: "u2", name: "Budi Santoso", email: "budi@kampus.ac.id", photo: null, created_at: "2026-03-04T00:00:00Z" };

beforeEach(() => {
  resetStores();
});

describe("UsersPage", () => {
  it("menampilkan status memuat lalu daftar pengguna", async () => {
    const pending = deferred();
    vi.mocked(fetchUsers).mockReturnValue(pending.promise);
    render(UsersPage);

    expect(await screen.findByText("Memuat pengguna...")).toBeInTheDocument();

    pending.resolve(ok({ users: [ayu, budi] }));
    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Ayu Lestari" })).toHaveAttribute("src", ayu.photo);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("menyaring berdasarkan nama atau email", async () => {
    vi.mocked(fetchUsers).mockResolvedValue(ok({ users: [ayu, budi] }));
    render(UsersPage);
    await screen.findByText("Budi Santoso");

    await typeInto("Cari pengguna", "ayu");
    expect(screen.getByText("Ayu Lestari")).toBeInTheDocument();
    expect(screen.queryByText("Budi Santoso")).not.toBeInTheDocument();

    await typeInto("Cari pengguna", "kampus.ac.id");
    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.queryByText("Ayu Lestari")).not.toBeInTheDocument();

    await typeInto("Cari pengguna", "tidak-ada");
    expect(screen.getByText("Tidak ada pengguna yang cocok.")).toBeInTheDocument();
  });

  it("menampilkan pesan kosong bila pemuatan gagal", async () => {
    vi.mocked(fetchUsers).mockResolvedValue(fail());
    render(UsersPage);
    await waitFor(() =>
      expect(screen.getByText("Tidak ada pengguna yang cocok.")).toBeInTheDocument()
    );
  });
});
