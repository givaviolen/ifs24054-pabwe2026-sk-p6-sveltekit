import { goto } from "$app/navigation";
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
  testUser,
} from "../../../test-utils";
import * as api from "../api/courseApi";
import DetailPage from "./DetailPage.svelte";

vi.mock("../api/courseApi");

const fire = Swal.fire as unknown as ReturnType<typeof vi.fn>;

const contents = [
  makeContent({ id: "ct1", title: "Materi Satu" }),
  makeContent({ id: "ct2", title: "Materi Dua" }),
];

const ownerCourse = makeCourse({
  id: "c1",
  user_id: "u1",
  title: "Kursus Saya",
  cover: "https://img.test/c1.png",
  contents,
  students: [{ id: "u2", name: "Budi" }, { id: "u3" }],
  ratings: [{ user_id: "u2", rating: 5 }, { user_id: "u3", rating: 4 }],
});
const studentCourse = makeCourse({
  id: "c1",
  user_id: "u9",
  title: "Kursus Orang",
  contents,
  students: [{ id: "u1" }],
  ratings: [{ user_id: "u1", rating: 3 }],
});
const visitorCourse = makeCourse({ id: "c1", user_id: "u9", title: "Kursus Terbuka", contents });

const show = async (course: any, user = testUser) => {
  vi.mocked(api.getCourse).mockResolvedValue(ok({ course }));
  renderWithProviders(DetailPage, { courseId: "c1" }, { user });
  await screen.findByRole("heading", { name: course.title });
};

beforeEach(() => {
  vi.mocked(api.getCourses).mockResolvedValue(ok({ courses: [] }));
});

describe("DetailPage - status halaman", () => {
  it("menampilkan status memuat", async () => {
    const pending = deferred();
    vi.mocked(api.getCourse).mockReturnValue(pending.promise);
    renderWithProviders(DetailPage, { courseId: "c1" });
    expect(await screen.findByText("Memuat kursus...")).toBeInTheDocument();
    pending.resolve(ok({ course: ownerCourse }));
    expect(await screen.findByRole("heading", { name: "Kursus Saya" })).toBeInTheDocument();
  });

  it("menampilkan pesan bila kursus tidak ditemukan", async () => {
    vi.mocked(api.getCourse).mockResolvedValue(fail("Tidak ditemukan"));
    renderWithProviders(DetailPage, { courseId: "zzz" });
    expect(await screen.findByText("Kursus tidak ditemukan")).toBeInTheDocument();
  });
});

describe("DetailPage - pemilik", () => {
  it("menampilkan antarmuka pemilik lengkap dengan sampul, materi, dan peserta", async () => {
    await show(ownerCourse);
    expect(screen.getByRole("img", { name: "Sampul Kursus Saya" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ubah data/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tambah materi/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Materi Satu" })).toHaveAttribute("href", "/courses/c1/contents/ct1");
    expect(screen.getByText("Budi")).toBeInTheDocument();
    expect(screen.getByText("u3")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ikuti kursus" })).not.toBeInTheDocument();
  });

  it("mendahulukan antarmuka pemilik bila pemilik juga peserta", async () => {
    await show({ ...ownerCourse, students: [{ id: "u1" }] });
    expect(screen.getByRole("button", { name: /Ubah data/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Keluar dari kursus" })).not.toBeInTheDocument();
  });

  it("menampilkan pesan kosong tanpa materi dan peserta", async () => {
    await show({ ...ownerCourse, cover: null, contents: [], students: [] });
    expect(screen.getByText("Belum ada materi di kursus ini.")).toBeInTheDocument();
    expect(screen.getByText("Belum ada peserta.")).toBeInTheDocument();
  });

  it("membuka dan menutup modal ubah data, sampul, serta tambah materi", async () => {
    await show(ownerCourse);

    await click(screen.getByRole("button", { name: /Ubah data/ }));
    expect(screen.getByRole("dialog", { name: "Ubah Kursus" })).toBeInTheDocument();
    await click(screen.getByRole("button", { name: "Batal" }));

    await click(screen.getByRole("button", { name: /Ubah sampul/ }));
    expect(screen.getByRole("dialog", { name: "Ubah Sampul" })).toBeInTheDocument();
    await click(screen.getByRole("button", { name: "Batal" }));

    await click(screen.getByRole("button", { name: /Tambah materi/ }));
    expect(screen.getByRole("dialog", { name: "Tambah Materi" })).toBeInTheDocument();
    await click(screen.getByRole("button", { name: "Batal" }));

    await click(screen.getByRole("button", { name: "Ubah Materi Dua" }));
    expect(screen.getByRole("dialog", { name: "Ubah Materi" })).toBeInTheDocument();
    expect(screen.getByLabelText("Judul materi")).toHaveValue("Materi Dua");
    await click(screen.getByRole("button", { name: "Batal" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("menghapus kursus lalu kembali ke beranda", async () => {
    vi.mocked(api.deleteCourse).mockResolvedValue(ok(null, "Kursus dihapus"));
    await show(ownerCourse);
    await click(screen.getByRole("button", { name: /Hapus kursus/ }));
    await waitFor(() => expect(goto).toHaveBeenCalledWith("/"));
    expect(api.deleteCourse).toHaveBeenCalledWith("c1");
  });

  it("tetap di halaman bila penghapusan gagal", async () => {
    vi.mocked(api.deleteCourse).mockResolvedValue(fail("Gagal menghapus"));
    await show(ownerCourse);
    await click(screen.getByRole("button", { name: /Hapus kursus/ }));
    await waitFor(() =>
      expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error" }))
    );
    expect(goto).not.toHaveBeenCalled();
  });

  it("tidak menghapus kursus bila konfirmasi dibatalkan", async () => {
    fire.mockResolvedValueOnce({ isConfirmed: false });
    await show(ownerCourse);
    await click(screen.getByRole("button", { name: /Hapus kursus/ }));
    await waitFor(() => expect(fire).toHaveBeenCalled());
    expect(api.deleteCourse).not.toHaveBeenCalled();
  });

  it("menghapus materi hanya setelah dikonfirmasi", async () => {
    vi.mocked(api.deleteContent).mockResolvedValue(ok(null, "Materi dihapus"));
    await show(ownerCourse);

    fire.mockResolvedValueOnce({ isConfirmed: false });
    await click(screen.getByRole("button", { name: "Hapus Materi Satu" }));
    await waitFor(() => expect(fire).toHaveBeenCalled());
    expect(api.deleteContent).not.toHaveBeenCalled();

    await click(screen.getByRole("button", { name: "Hapus Materi Satu" }));
    await waitFor(() => expect(api.deleteContent).toHaveBeenCalledWith("ct1"));
  });
});

describe("DetailPage - peserta", () => {
  it("menampilkan rating pengguna dan memberi rating baru", async () => {
    vi.mocked(api.postRating).mockResolvedValue(ok(null, "Rating tersimpan"));
    await show(studentCourse);

    expect(screen.queryByRole("button", { name: /Ubah data/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Materi Satu" })).toBeInTheDocument();

    await click(screen.getByRole("button", { name: "Beri rating 5" }));
    await waitFor(() => expect(api.postRating).toHaveBeenCalledWith("c1", 5));
  });

  it("keluar dari kursus", async () => {
    vi.mocked(api.leaveCourseRequest).mockResolvedValue(ok(null, "Anda keluar"));
    await show(studentCourse);
    await click(screen.getByRole("button", { name: "Keluar dari kursus" }));
    await waitFor(() => expect(api.leaveCourseRequest).toHaveBeenCalledWith("c1"));
  });
});

describe("DetailPage - pengunjung", () => {
  it("mengunci materi dan dapat mengikuti kursus", async () => {
    vi.mocked(api.joinCourseRequest).mockResolvedValue(ok(null, "Anda bergabung"));
    await show(visitorCourse);

    expect(screen.queryByRole("link", { name: "Materi Satu" })).not.toBeInTheDocument();
    expect(screen.getByText("Materi Satu")).toBeInTheDocument();

    await click(screen.getByRole("button", { name: "Ikuti kursus" }));
    await waitFor(() => expect(api.joinCourseRequest).toHaveBeenCalledWith("c1"));
  });
});
