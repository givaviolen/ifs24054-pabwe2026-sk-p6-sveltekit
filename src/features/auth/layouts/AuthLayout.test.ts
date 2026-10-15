import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { snippetOf } from "../../../test-utils";
import AuthLayout from "./AuthLayout.svelte";

describe("AuthLayout", () => {
  it("menampilkan teks pengenal kursus dan isi halaman", () => {
    render(AuthLayout, { props: { children: snippetOf("<p>Isi halaman auth</p>") } });

    expect(screen.getAllByText("Delcom Courses").length).toBeGreaterThan(0);
    expect(screen.getByText(/Belajar lewat kursus video/)).toBeInTheDocument();
    expect(screen.getByText("Isi halaman auth")).toBeInTheDocument();
  });
});
