import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import Swal from "sweetalert2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { click, deferred, fail, makeCourse, makeFile, ok, resetStores, submitForm } from "../../../test-utils";
import * as api from "../api/courseApi";
import ChangeCoverModal from "./ChangeCoverModal.svelte";

vi.mock("../api/courseApi");

const fire = Swal.fire as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetStores();
  vi.mocked(api.getCourse).mockResolvedValue(ok({ course: makeCourse() }));
});

const pickCover = async (file = makeFile("sampul.png")) => {
  await fireEvent.change(screen.getByLabelText("Pilih sampul"), { target: { files: [file] } });
  return file;
};

describe("ChangeCoverModal", () => {
  it("memperingatkan bila belum memilih gambar", async () => {
    render(ChangeCoverModal, { props: { courseId: "c1", onclose: vi.fn() } });
    await submitForm("change-cover-form");
    expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning" }));
    expect(api.postCourseCover).not.toHaveBeenCalled();
  });

  it("mengunggah sampul lalu menutup modal", async () => {
    vi.mocked(api.postCourseCover).mockResolvedValue(ok(null, "Sampul diubah"));
    const onclose = vi.fn();
    render(ChangeCoverModal, { props: { courseId: "c1", onclose } });

    const file = await pickCover();
    await submitForm("change-cover-form");

    await waitFor(() => expect(onclose).toHaveBeenCalledTimes(1));
    expect(api.postCourseCover).toHaveBeenCalledWith("c1", file);
  });

  it("tetap terbuka bila unggahan gagal", async () => {
    vi.mocked(api.postCourseCover).mockResolvedValue(fail("Berkas terlalu besar"));
    const onclose = vi.fn();
    render(ChangeCoverModal, { props: { courseId: "c1", onclose } });

    await pickCover();
    await submitForm("change-cover-form");

    await waitFor(() =>
      expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error" }))
    );
    expect(onclose).not.toHaveBeenCalled();
  });

  it("menampilkan status mengunggah dan dapat dibatalkan", async () => {
    const pending = deferred();
    vi.mocked(api.postCourseCover).mockReturnValue(pending.promise);
    const onclose = vi.fn();
    render(ChangeCoverModal, { props: { courseId: "c1", onclose } });

    await pickCover();
    await submitForm("change-cover-form");
    expect(await screen.findByRole("button", { name: "Mengunggah..." })).toBeDisabled();
    pending.resolve(fail());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Unggah sampul" })).toBeEnabled()
    );

    await click(screen.getByRole("button", { name: "Batal" }));
    expect(onclose).toHaveBeenCalledTimes(1);
  });
});
