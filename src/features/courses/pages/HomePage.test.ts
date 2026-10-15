import { screen, waitFor } from "@testing-library/svelte";
import Swal from "sweetalert2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  click,
  deferred,
  fail,
  makeContent,
  makeCourse,
  ok,
  renderWithProviders,
  typeInto,
} from "../../../test-utils";
import * as api from "../api/courseApi";
import HomePage from "./HomePage.svelte";

vi.mock("../api/courseApi");

const fire = Swal.fire as unknown as ReturnType<typeof vi.fn>;

const mine = makeCourse({
  id: "c1",
  user_id: "u1",
  title: "Svelte Dasar",
  cover: "https://img.test/c1.png",
  students: [{ id: "u2" }],
  contents: [makeContent()],
  ratings: [{ user_id: "u2", rating: 4 }],
});
const other = makeCourse({ id: "c2", user_id: "u9", title: "Angular Lanjut" });

beforeEach(() => {
  vi.mocked(api.getCourses).mockResolvedValue(ok({ courses: [mine, other] }));
});

describe("HomePage - daftar", () => {
  it("menampilkan status memuat lalu daftar kursus", async () => {
    const pending = deferred();
    vi.mocked(api.getCourses).mockReturnValue(pending.promise);
    renderWithProviders(HomePage);

    expect(await screen.findByText("Memuat kursus...")).toBeInTheDocument();

    pending.resolve(ok({ courses: [mine, other] }));
    expect(await screen.findByText("Svelte Dasar")).toBeInTheDocument();
    expect(screen.getByText("Angular Lanjut")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Sampul Svelte Dasar" })).toHaveAttribute("src", "https://img.test/c1.png");
    expect(screen.getByRole("link", { name: "Svelte Dasar" })).toHaveAttribute("href", "/courses/c1");
  });

  it("menampilkan pesan kosong bila tidak ada kursus", async () => {
    vi.mocked(api.getCourses).mockResolvedValue(ok({ courses: [] }));
    renderWithProviders(HomePage);
    expect(await screen.findByText(/Belum ada kursus yang cocok/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Hapus semua/ })).not.toBeInTheDocument();
  });

  it("hanya menampilkan tombol hapus untuk kursus milik sendiri", async () => {
    renderWithProviders(HomePage);
    await screen.findByText("Svelte Dasar");
    expect(screen.getByRole("button", { name: "Hapus Svelte Dasar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hapus Angular Lanjut" })).not.toBeInTheDocument();
  });
});

describe("HomePage - pencarian dan filter", () => {
  it("menyaring berdasarkan judul", async () => {
    renderWithProviders(HomePage);
    await screen.findByText("Svelte Dasar");

    await typeInto("Cari kursus", "angular");
    expect(screen.getByText("Angular Lanjut")).toBeInTheDocument();
    expect(screen.queryByText("Svelte Dasar")).not.toBeInTheDocument();
  });

  it("menampilkan hanya kursus milik saya", async () => {
    renderWithProviders(HomePage);
    await screen.findByText("Angular Lanjut");

    await click(screen.getByLabelText("Hanya milik saya"));
    expect(screen.queryByText("Angular Lanjut")).not.toBeInTheDocument();
    expect(screen.getByText("Svelte Dasar")).toBeInTheDocument();
  });
});

describe("HomePage - hapus", () => {
  it("menghapus satu kursus setelah dikonfirmasi", async () => {
    vi.mocked(api.deleteCourse).mockResolvedValue(ok(null, "Kursus dihapus"));
    renderWithProviders(HomePage);
    await screen.findByText("Svelte Dasar");

    await click(screen.getByRole("button", { name: "Hapus Svelte Dasar" }));

    await waitFor(() => expect(screen.queryByText("Svelte Dasar")).not.toBeInTheDocument());
    expect(api.deleteCourse).toHaveBeenCalledWith("c1");
  });

  it("tidak menghapus bila konfirmasi dibatalkan", async () => {
    fire.mockResolvedValueOnce({ isConfirmed: false });
    renderWithProviders(HomePage);
    await screen.findByText("Svelte Dasar");

    await click(screen.getByRole("button", { name: "Hapus Svelte Dasar" }));
    await waitFor(() => expect(fire).toHaveBeenCalled());
    expect(api.deleteCourse).not.toHaveBeenCalled();
  });

  it("menghapus semua kursus milik sendiri setelah dikonfirmasi", async () => {
    vi.mocked(api.deleteAllCourses).mockResolvedValue(ok(null, "Semua dihapus"));
    renderWithProviders(HomePage);
    await screen.findByText("Svelte Dasar");

    await click(screen.getByRole("button", { name: /Hapus semua milik saya/ }));

    await waitFor(() => expect(api.deleteAllCourses).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText("Svelte Dasar")).not.toBeInTheDocument());
  });

  it("tidak menghapus semua bila konfirmasi dibatalkan", async () => {
    fire.mockResolvedValueOnce({ isConfirmed: false });
    renderWithProviders(HomePage);
    await screen.findByText("Svelte Dasar");

    await click(screen.getByRole("button", { name: /Hapus semua milik saya/ }));
    await waitFor(() => expect(fire).toHaveBeenCalled());
    expect(api.deleteAllCourses).not.toHaveBeenCalled();
  });

  it("menampilkan galat bila penghapusan gagal", async () => {
    vi.mocked(api.deleteCourse).mockResolvedValue(fail("Tidak boleh dihapus"));
    renderWithProviders(HomePage);
    await screen.findByText("Svelte Dasar");

    await click(screen.getByRole("button", { name: "Hapus Svelte Dasar" }));
    await waitFor(() =>
      expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error" }))
    );
    expect(screen.getByText("Svelte Dasar")).toBeInTheDocument();
  });
});

describe("HomePage - tambah", () => {
  it("membuka dan menutup modal tambah kursus", async () => {
    renderWithProviders(HomePage);
    await screen.findByText("Svelte Dasar");

    await click(screen.getByRole("button", { name: /Tambah kursus/ }));
    expect(screen.getByRole("dialog", { name: "Tambah Kursus" })).toBeInTheDocument();

    await click(screen.getByRole("button", { name: "Batal" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
