import { render, screen, waitFor } from "@testing-library/svelte";
import Swal from "sweetalert2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  click,
  deferred,
  fail,
  makeContent,
  makeCourse,
  ok,
  resetStores,
  submitForm,
  typeInto,
} from "../../../test-utils";
import * as api from "../api/courseApi";
import ContentModal from "./ContentModal.svelte";

vi.mock("../api/courseApi");

const fire = Swal.fire as unknown as ReturnType<typeof vi.fn>;
const validUrl = "https://youtu.be/dQw4w9WgXcQ";

beforeEach(() => {
  resetStores();
  vi.mocked(api.getCourse).mockResolvedValue(ok({ course: makeCourse() }));
});

describe("ContentModal - tambah materi", () => {
  it("memperingatkan bila judul kosong", async () => {
    render(ContentModal, { props: { courseId: "c1", onclose: vi.fn() } });
    expect(screen.getByRole("dialog", { name: "Tambah Materi" })).toBeInTheDocument();
    await submitForm("content-form");
    expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning" }));
    expect(api.postContent).not.toHaveBeenCalled();
  });

  it("memperingatkan bila tautan YouTube tidak valid", async () => {
    render(ContentModal, { props: { courseId: "c1", onclose: vi.fn() } });
    await typeInto("Judul materi", "Pengenalan");
    await typeInto("Tautan YouTube", "https://example.com/video");
    await submitForm("content-form");
    expect(fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: "warning", text: "Masukkan tautan YouTube yang valid." })
    );
    expect(api.postContent).not.toHaveBeenCalled();
  });

  it("menambah materi lalu menutup modal", async () => {
    vi.mocked(api.postContent).mockResolvedValue(ok(null, "Materi ditambahkan"));
    const onclose = vi.fn();
    render(ContentModal, { props: { courseId: "c1", onclose } });

    await typeInto("Judul materi", " Pengenalan ");
    await typeInto("Tautan YouTube", validUrl);
    await submitForm("content-form");

    await waitFor(() => expect(onclose).toHaveBeenCalledTimes(1));
    expect(api.postContent).toHaveBeenCalledWith("c1", { title: "Pengenalan", youtube: validUrl });
  });

  it("tetap terbuka bila gagal, dan menampilkan status menyimpan", async () => {
    const pending = deferred();
    vi.mocked(api.postContent).mockReturnValue(pending.promise);
    const onclose = vi.fn();
    render(ContentModal, { props: { courseId: "c1", onclose } });

    await typeInto("Judul materi", "Pengenalan");
    await typeInto("Tautan YouTube", validUrl);
    await submitForm("content-form");
    expect(await screen.findByRole("button", { name: "Menyimpan..." })).toBeDisabled();

    pending.resolve(fail("Gagal menyimpan"));
    await waitFor(() =>
      expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error" }))
    );
    expect(onclose).not.toHaveBeenCalled();

    await click(screen.getByRole("button", { name: "Batal" }));
    expect(onclose).toHaveBeenCalledTimes(1);
  });
});

describe("ContentModal - ubah materi", () => {
  it("terisi data materi dan menyimpan perubahan", async () => {
    vi.mocked(api.putContent).mockResolvedValue(ok(null, "Materi diubah"));
    const onclose = vi.fn();
    const content = makeContent({ id: "ct7", title: "Materi Lama", youtube: validUrl });
    render(ContentModal, { props: { courseId: "c1", content, onclose } });

    expect(screen.getByRole("dialog", { name: "Ubah Materi" })).toBeInTheDocument();
    expect(screen.getByLabelText("Judul materi")).toHaveValue("Materi Lama");
    expect(screen.getByLabelText("Tautan YouTube")).toHaveValue(validUrl);

    await typeInto("Judul materi", "Materi Baru");
    await submitForm("content-form");

    await waitFor(() => expect(onclose).toHaveBeenCalledTimes(1));
    expect(api.putContent).toHaveBeenCalledWith("ct7", { title: "Materi Baru", youtube: validUrl });
    expect(api.postContent).not.toHaveBeenCalled();
  });
});
