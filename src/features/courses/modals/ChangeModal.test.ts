import { render, screen, waitFor } from "@testing-library/svelte";
import Swal from "sweetalert2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { click, deferred, fail, makeCourse, ok, resetStores, submitForm, typeInto } from "../../../test-utils";
import * as api from "../api/courseApi";
import ChangeModal from "./ChangeModal.svelte";

vi.mock("../api/courseApi");

const fire = Swal.fire as unknown as ReturnType<typeof vi.fn>;
const course = makeCourse({ title: "Judul Lama", description: "Deskripsi lama" });

beforeEach(() => {
  resetStores();
  vi.mocked(api.getCourse).mockResolvedValue(ok({ course }));
});

describe("ChangeModal", () => {
  it("terisi data kursus saat dibuka", () => {
    render(ChangeModal, { props: { course, onclose: vi.fn() } });
    expect(screen.getByLabelText("Judul")).toHaveValue("Judul Lama");
    expect((globalThis as any).__editor.options.initialValue).toBe("Deskripsi lama");
  });

  it("memperingatkan bila judul dikosongkan", async () => {
    render(ChangeModal, { props: { course, onclose: vi.fn() } });
    await typeInto("Judul", " ");
    await submitForm("change-course-form");
    expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning" }));
    expect(api.putCourse).not.toHaveBeenCalled();
  });

  it("menyimpan perubahan lalu menutup modal", async () => {
    vi.mocked(api.putCourse).mockResolvedValue(ok(null, "Kursus diubah"));
    const onclose = vi.fn();
    render(ChangeModal, { props: { course, onclose } });

    await typeInto("Judul", "Judul Baru");
    await submitForm("change-course-form");

    await waitFor(() => expect(onclose).toHaveBeenCalledTimes(1));
    expect(api.putCourse).toHaveBeenCalledWith("c1", {
      title: "Judul Baru",
      description: "Deskripsi lama",
    });
  });

  it("tetap terbuka bila penyimpanan gagal", async () => {
    vi.mocked(api.putCourse).mockResolvedValue(fail("Tidak boleh mengubah"));
    const onclose = vi.fn();
    render(ChangeModal, { props: { course, onclose } });

    await submitForm("change-course-form");

    await waitFor(() =>
      expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error" }))
    );
    expect(onclose).not.toHaveBeenCalled();
  });

  it("menampilkan status menyimpan dan dapat dibatalkan", async () => {
    const pending = deferred();
    vi.mocked(api.putCourse).mockReturnValue(pending.promise);
    const onclose = vi.fn();
    render(ChangeModal, { props: { course, onclose } });

    await submitForm("change-course-form");
    expect(await screen.findByRole("button", { name: "Menyimpan..." })).toBeDisabled();
    pending.resolve(fail());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Simpan perubahan" })).toBeEnabled()
    );

    await click(screen.getByRole("button", { name: "Batal" }));
    expect(onclose).toHaveBeenCalledTimes(1);
  });
});
