import { screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { click, deferred, fail, makeContent, ok, renderWithProviders } from "../../../test-utils";
import * as api from "../api/courseApi";
import ContentPage from "./ContentPage.svelte";

vi.mock("../api/courseApi");

const renderContent = () => renderWithProviders(ContentPage, { courseId: "c1", contentId: "ct1" });

beforeEach(() => {
  vi.mocked(api.putLearned).mockResolvedValue(ok(null, "Status diperbarui"));
});

describe("ContentPage", () => {
  it("menampilkan status memuat lalu pemutar YouTube", async () => {
    const pending = deferred();
    vi.mocked(api.getContent).mockReturnValue(pending.promise);
    renderContent();

    expect(await screen.findByText("Memuat materi...")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kembali ke kursus/ })).toHaveAttribute("href", "/courses/c1");

    pending.resolve(ok({ course_content: makeContent({ title: "Pengenalan Svelte" }) }));
    expect(await screen.findByRole("heading", { name: "Pengenalan Svelte" })).toBeInTheDocument();
    expect(screen.getByTitle("Pengenalan Svelte")).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ"
    );
  });

  it("menampilkan pesan bila materi tidak ditemukan", async () => {
    vi.mocked(api.getContent).mockResolvedValue(fail("Tidak ada"));
    renderContent();
    expect(await screen.findByText("Materi tidak ditemukan")).toBeInTheDocument();
  });

  it("menampilkan peringatan bila tautan video tidak valid", async () => {
    vi.mocked(api.getContent).mockResolvedValue(
      ok({ course_content: makeContent({ youtube: "https://example.com/x" }) })
    );
    renderContent();
    expect(await screen.findByText(/Tautan video tidak valid/)).toBeInTheDocument();
    expect(screen.queryByTitle("Pengenalan Svelte")).not.toBeInTheDocument();
  });

  it("menandai selesai lalu menandai belum selesai", async () => {
    vi.mocked(api.getContent).mockResolvedValue(ok({ course_content: makeContent({ learned: false }) }));
    renderContent();

    await click(await screen.findByRole("button", { name: "Tandai selesai" }));
    await waitFor(() => expect(api.putLearned).toHaveBeenLastCalledWith("ct1", 1));

    await click(await screen.findByRole("button", { name: "Tandai belum selesai" }));
    await waitFor(() => expect(api.putLearned).toHaveBeenLastCalledWith("ct1", 0));
    expect(await screen.findByRole("button", { name: "Tandai selesai" })).toBeInTheDocument();
  });
});
