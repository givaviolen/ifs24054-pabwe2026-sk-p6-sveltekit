import { goto } from "$app/navigation";
import { screen } from "@testing-library/svelte";
import { get } from "svelte/store";
import Swal from "sweetalert2";
import { describe, expect, it, vi } from "vitest";
import { click, renderWithProviders, testUser } from "../../../test-utils";
import { isLoggedIn } from "../../auth/states/authStore";
import Navbar from "./Navbar.svelte";

const fire = Swal.fire as unknown as ReturnType<typeof vi.fn>;

describe("Navbar", () => {
  it("menampilkan nama dan inisial pengguna", () => {
    renderWithProviders(Navbar, { ontoggle: vi.fn() });
    expect(screen.getByText("Ayu Lestari")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Delcom Courses/ })).toHaveAttribute("href", "/");
  });

  it("menampilkan foto bila tersedia", () => {
    renderWithProviders(Navbar, { ontoggle: vi.fn() }, { user: { ...testUser, photo: "https://img.test/a.png" } });
    expect(screen.getByRole("img", { name: "Foto profil" })).toHaveAttribute("src", "https://img.test/a.png");
  });

  it("menampilkan tanda tanya bila profil belum ada", () => {
    renderWithProviders(Navbar, { ontoggle: vi.fn() }, { loggedIn: false });
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("memanggil ontoggle saat tombol menu ditekan", async () => {
    const ontoggle = vi.fn();
    renderWithProviders(Navbar, { ontoggle });
    await click(screen.getByRole("button", { name: "Buka menu" }));
    expect(ontoggle).toHaveBeenCalledTimes(1);
  });

  it("keluar dari akun setelah dikonfirmasi", async () => {
    renderWithProviders(Navbar, { ontoggle: vi.fn() });
    await click(screen.getByRole("button", { name: "Keluar" }));

    await vi.waitFor(() => expect(goto).toHaveBeenCalledWith("/auth/login"));
    expect(get(isLoggedIn)).toBe(false);
  });

  it("tetap masuk bila konfirmasi dibatalkan", async () => {
    fire.mockResolvedValueOnce({ isConfirmed: false });
    renderWithProviders(Navbar, { ontoggle: vi.fn() });
    await click(screen.getByRole("button", { name: "Keluar" }));

    await vi.waitFor(() => expect(fire).toHaveBeenCalled());
    expect(goto).not.toHaveBeenCalled();
    expect(get(isLoggedIn)).toBe(true);
  });
});
