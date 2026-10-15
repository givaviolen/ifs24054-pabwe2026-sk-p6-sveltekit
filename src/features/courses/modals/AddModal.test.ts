import { render, screen, waitFor } from "@testing-library/svelte";
import Swal from "sweetalert2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { click, deferred, fail, ok, resetStores, submitForm, typeInto } from "../../../test-utils";
import * as api from "../api/courseApi";
import AddModal from "./AddModal.svelte";

vi.mock("../api/courseApi");

const fire = Swal.fire as unknown as ReturnType<typeof vi.fn>;
const g = globalThis as any;

beforeEach(() => {
  resetStores();
  vi.mocked(api.getCourses).mockResolvedValue(ok({ courses: [] }));
});

describe("AddModal", () => {
  it("memperingatkan bila judul kosong", async () => {
    render(AddModal, { props: { onclose: vi.fn() } });
    await submitForm("add-course-form");
    expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning" }));
    expect(api.postCourse).not.toHaveBeenCalled();
  });

  it("membuat kursus lalu menutup modal", async () => {
    vi.mocked(api.postCourse).mockResolvedValue(ok({ course_id: "c9" }, "Kursus dibuat"));
    const onclose = vi.fn();
    render(AddModal, { props: { onclose } });

    await typeInto("Judul", "  Kursus Baru  ");
    g.__markdown = "Deskripsi kursus";
    g.__editor.options.events.change();
    await submitForm("add-course-form");

    await waitFor(() => expect(onclose).toHaveBeenCalledTimes(1));
    expect(api.postCourse).toHaveBeenCalledWith({
      title: "Kursus Baru",
      description: "Deskripsi kursus",
    });
  });

  it("tetap terbuka bila pembuatan gagal", async () => {
    vi.mocked(api.postCourse).mockResolvedValue(fail("Judul sudah dipakai"));
    const onclose = vi.fn();
    render(AddModal, { props: { onclose } });

    await typeInto("Judul", "Kursus");
    await submitForm("add-course-form");

    await waitFor(() =>
      expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error" }))
    );
    expect(onclose).not.toHaveBeenCalled();
  });

  it("menampilkan status menyimpan selama permintaan berjalan", async () => {
    const pending = deferred();
    vi.mocked(api.postCourse).mockReturnValue(pending.promise);
    render(AddModal, { props: { onclose: vi.fn() } });

    await typeInto("Judul", "Kursus");
    await submitForm("add-course-form");

    expect(await screen.findByRole("button", { name: "Menyimpan..." })).toBeDisabled();
    pending.resolve(fail());
    await waitFor(() => expect(screen.getByRole("button", { name: "Simpan" })).toBeEnabled());
  });

  it("menutup modal lewat tombol batal", async () => {
    const onclose = vi.fn();
    render(AddModal, { props: { onclose } });
    await click(screen.getByRole("button", { name: "Batal" }));
    expect(onclose).toHaveBeenCalledTimes(1);
  });
});
