import { page } from "$app/state";
import { render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeContent, makeCourse, ok, renderWithProviders, resetStores, snippetOf, testUser } from "../test-utils";
import { fetchMe } from "../features/auth/api/authApi";
import * as courseApi from "../features/courses/api/courseApi";
import { fetchUsers } from "../features/users/api/userApi";
import { ssr } from "./+layout";
import AuthLayoutRoute from "./auth/+layout.svelte";
import LoginRoute from "./auth/login/+page.svelte";
import RegisterRoute from "./auth/register/+page.svelte";
import ContentRoute from "./courses/[courseId]/contents/[contentId]/+page.svelte";
import DetailRoute from "./courses/[courseId]/+page.svelte";
import ErrorRoute from "./+error.svelte";
import HomeRoute from "./+page.svelte";
import ProfileRoute from "./profile/+page.svelte";
import UsersRoute from "./users/+page.svelte";

vi.mock("../features/auth/api/authApi", () => ({
  fetchMe: vi.fn(),
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
}));
vi.mock("../features/courses/api/courseApi");
vi.mock("../features/users/api/userApi", () => ({
  fetchUsers: vi.fn(),
  postPhoto: vi.fn(),
  putPassword: vi.fn(),
  putProfile: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(fetchMe).mockResolvedValue(ok({ user: testUser }));
});

describe("konfigurasi rute", () => {
  it("mematikan render di server", () => {
    expect(ssr).toBe(false);
  });
});

describe("rute halaman", () => {
  it("/ menampilkan daftar kursus", async () => {
    vi.mocked(courseApi.getCourses).mockResolvedValue(ok({ courses: [makeCourse({ title: "Kursus Beranda" })] }));
    renderWithProviders(HomeRoute);
    expect(await screen.findByText("Kursus Beranda")).toBeInTheDocument();
  });

  it("/auth/login dan /auth/register menampilkan formulir", () => {
    resetStores();
    const login = render(LoginRoute);
    expect(screen.getByRole("heading", { name: "Masuk ke akunmu" })).toBeInTheDocument();
    login.unmount();
    render(RegisterRoute);
    expect(screen.getByRole("heading", { name: "Buat akun baru" })).toBeInTheDocument();
  });

  it("/auth memakai layout autentikasi", () => {
    resetStores();
    render(AuthLayoutRoute, { props: { children: snippetOf("<p>Anak rute auth</p>") } });
    expect(screen.getByText("Anak rute auth")).toBeInTheDocument();
    expect(screen.getByText(/Belajar lewat kursus video/)).toBeInTheDocument();
  });

  it("/courses/[courseId] membaca parameter dari page", async () => {
    (page as any).params = { courseId: "c7" };
    vi.mocked(courseApi.getCourse).mockResolvedValue(ok({ course: makeCourse({ id: "c7", title: "Kursus Tujuh" }) }));
    renderWithProviders(DetailRoute);
    expect(await screen.findByRole("heading", { name: "Kursus Tujuh" })).toBeInTheDocument();
    expect(courseApi.getCourse).toHaveBeenCalledWith("c7");
  });

  it("/courses/[courseId]/contents/[contentId] membaca kedua parameter", async () => {
    (page as any).params = { courseId: "c7", contentId: "ct9" };
    vi.mocked(courseApi.getContent).mockResolvedValue(ok({ course_content: makeContent({ id: "ct9", title: "Materi Sembilan" }) }));
    renderWithProviders(ContentRoute);
    expect(await screen.findByRole("heading", { name: "Materi Sembilan" })).toBeInTheDocument();
    expect(courseApi.getContent).toHaveBeenCalledWith("ct9");
  });

  it("/users menampilkan daftar pengguna", async () => {
    vi.mocked(fetchUsers).mockResolvedValue(ok({ users: [{ ...testUser, name: "Pengguna Uji" }] }));
    renderWithProviders(UsersRoute);
    expect(await screen.findByText("Pengguna Uji")).toBeInTheDocument();
  });

  it("/profile menampilkan profil", () => {
    renderWithProviders(ProfileRoute);
    expect(screen.getByRole("heading", { name: "Ayu Lestari" })).toBeInTheDocument();
  });

  it("+error.svelte menampilkan halaman tidak ditemukan", () => {
    render(ErrorRoute);
    expect(screen.getByText("Halaman tidak ditemukan")).toBeInTheDocument();
  });
});
