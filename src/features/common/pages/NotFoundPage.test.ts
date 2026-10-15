import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import NotFoundPage from "./NotFoundPage.svelte";

describe("NotFoundPage", () => {
  it("menampilkan pesan tidak ditemukan dan tautan kembali", () => {
    render(NotFoundPage);
    expect(screen.getByText("Halaman tidak ditemukan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kembali ke Semua Kursus/ })).toHaveAttribute("href", "/");
  });
});
