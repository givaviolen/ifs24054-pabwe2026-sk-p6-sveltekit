import { render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { click, snippetOf } from "../../../test-utils";
import Modal from "./Modal.svelte";

describe("Modal", () => {
  const setup = () => {
    const onclose = vi.fn();
    render(Modal, { props: { title: "Judul Modal", onclose, children: snippetOf("<p>Isi modal</p>") } });
    return onclose;
  };

  it("menampilkan judul dan isi", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Judul Modal" })).toBeInTheDocument();
    expect(screen.getByText("Isi modal")).toBeInTheDocument();
  });

  it("menutup lewat tombol silang dan latar belakang", async () => {
    const onclose = setup();
    await click(screen.getByRole("button", { name: "Tutup dialog" }));
    await click(screen.getByRole("button", { name: "Tutup latar" }));
    expect(onclose).toHaveBeenCalledTimes(2);
  });
});
