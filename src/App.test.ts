import { goto } from "$app/navigation";
import { page } from "$app/state";
import { render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMe } from "./features/auth/api/authApi";
import { putAccessToken } from "./helpers/apiHelper";
import RootLayout from "./routes/+layout.svelte";
import { fail, ok, resetStores, snippetOf, testUser } from "./test-utils";

vi.mock("./features/auth/api/authApi", () => ({
  fetchMe: vi.fn(),
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
}));

const setPath = (path: string) => {
  (page as any).url = new URL(`http://localhost${path}`);
};

const renderRoot = () =>
  render(RootLayout, { props: { children: snippetOf("<p>Isi rute</p>") } });

beforeEach(() => {
  resetStores();
});

describe("layout root", () => {
  it("merender rute /auth langsung tanpa layout kursus", () => {
    setPath("/auth/login");
    renderRoot();
    expect(screen.getByText("Isi rute")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Menu utama" })).not.toBeInTheDocument();
  });

  it("memulihkan sesi lalu membungkus rute lain dengan CourseLayout", async () => {
    setPath("/");
    putAccessToken("tok");
    vi.mocked(fetchMe).mockResolvedValue(ok({ user: testUser }));
    renderRoot();

    expect(await screen.findByText("Isi rute")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Menu utama" })).toBeInTheDocument();
  });

  it("mengarahkan ke login bila tidak ada sesi", async () => {
    setPath("/users");
    renderRoot();
    await waitFor(() => expect(goto).toHaveBeenCalledWith("/auth/login"));
    expect(screen.queryByText("Isi rute")).not.toBeInTheDocument();
  });

  it("mengarahkan ke login bila token tidak valid lagi", async () => {
    setPath("/");
    putAccessToken("kedaluwarsa");
    vi.mocked(fetchMe).mockResolvedValue(fail("Token tidak valid"));
    renderRoot();
    await waitFor(() => expect(goto).toHaveBeenCalledWith("/auth/login"));
  });
});
