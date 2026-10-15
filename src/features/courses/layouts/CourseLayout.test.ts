import { goto } from "$app/navigation";
import { screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { describe, expect, it } from "vitest";
import { click, renderWithProviders, snippetOf } from "../../../test-utils";
import CourseLayout from "./CourseLayout.svelte";

const props = () => ({ children: snippetOf("<p>Isi halaman kursus</p>") });

describe("CourseLayout", () => {
  it("membungkus isi dengan navbar dan sidebar untuk pengguna yang masuk", () => {
    renderWithProviders(CourseLayout, props());
    expect(screen.getByText("Isi halaman kursus")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Menu utama" })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("membuka dan menutup sidebar pada layar kecil", async () => {
    renderWithProviders(CourseLayout, props());
    expect(screen.queryByRole("button", { name: "Tutup menu" })).not.toBeInTheDocument();

    await click(screen.getByRole("button", { name: "Buka menu" }));
    await click(screen.getByRole("button", { name: "Tutup menu" }));
    expect(screen.queryByRole("button", { name: "Tutup menu" })).not.toBeInTheDocument();
  });

  it("mengarahkan ke halaman login bila sesi siap tetapi belum masuk", async () => {
    renderWithProviders(CourseLayout, props(), { loggedIn: false, ready: true });
    expect(screen.getByText("Memuat sesi...")).toBeInTheDocument();
    await tick();
    expect(goto).toHaveBeenCalledWith("/auth/login");
  });

  it("menunggu sesi dipulihkan sebelum mengarahkan", async () => {
    renderWithProviders(CourseLayout, props(), { loggedIn: false, ready: false });
    await tick();
    expect(screen.getByText("Memuat sesi...")).toBeInTheDocument();
    expect(goto).not.toHaveBeenCalled();
  });
});
