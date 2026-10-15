import { page } from "$app/state";
import { render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { click } from "../../../test-utils";
import Sidebar from "./Sidebar.svelte";

const setPath = (path: string) => {
  (page as any).url = new URL(`http://localhost${path}`);
};

const activeLabel = () =>
  screen
    .getAllByRole("link")
    .filter((link) => link.className.includes("bg-indigo-50"))
    .map((link) => link.textContent?.trim());

describe("Sidebar", () => {
  it("menampilkan tiga menu utama", () => {
    render(Sidebar, { props: { open: false, onclose: vi.fn() } });
    expect(screen.getByRole("link", { name: "Semua Kursus" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Pengguna" })).toHaveAttribute("href", "/users");
    expect(screen.getByRole("link", { name: "Profil Saya" })).toHaveAttribute("href", "/profile");
  });

  it.each([
    ["/", "Semua Kursus"],
    ["/courses/c1", "Semua Kursus"],
    ["/users", "Pengguna"],
    ["/profile", "Profil Saya"],
  ])("menandai menu aktif untuk %s", (path, label) => {
    setPath(path);
    render(Sidebar, { props: { open: false, onclose: vi.fn() } });
    expect(activeLabel()).toEqual([label]);
  });

  it("tidak menandai menu apa pun untuk rute lain", () => {
    setPath("/entah");
    render(Sidebar, { props: { open: false, onclose: vi.fn() } });
    expect(activeLabel()).toEqual([]);
  });

  it("hanya menampilkan latar belakang saat terbuka dan menutup lewat latar", async () => {
    const onclose = vi.fn();
    const { rerender } = render(Sidebar, { props: { open: false, onclose } });
    expect(screen.queryByRole("button", { name: "Tutup menu" })).not.toBeInTheDocument();

    await rerender({ open: true, onclose });
    await click(screen.getByRole("button", { name: "Tutup menu" }));
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it("menutup sidebar saat tautan dipilih", async () => {
    const onclose = vi.fn();
    render(Sidebar, { props: { open: true, onclose } });
    await click(screen.getByRole("link", { name: "Pengguna" }));
    expect(onclose).toHaveBeenCalledTimes(1);
  });
});
