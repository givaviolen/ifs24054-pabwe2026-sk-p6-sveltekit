import Swal from "sweetalert2";
import { describe, expect, it, vi } from "vitest";
import {
  averageRating,
  cn,
  formatDate,
  getYoutubeEmbedUrl,
  notify,
  pickFile,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
  showWarningDialog,
} from "./toolsHelper";

const fire = Swal.fire as unknown as ReturnType<typeof vi.fn>;

describe("cn", () => {
  it("menggabungkan kelas dan menyelesaikan konflik Tailwind", () => {
    expect(cn("px-2", false && "hidden", "px-4")).toBe("px-4");
  });
});

describe("dialog", () => {
  it("menampilkan dialog sukses dengan judul bawaan dan khusus", () => {
    showSuccessDialog("Tersimpan");
    expect(fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ icon: "success", title: "Berhasil", text: "Tersimpan" })
    );
    showSuccessDialog("Tersimpan", "Mantap");
    expect(fire).toHaveBeenLastCalledWith(expect.objectContaining({ title: "Mantap" }));
  });

  it("menampilkan dialog galat dengan judul bawaan dan khusus", () => {
    showErrorDialog("Rusak");
    expect(fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ icon: "error", title: "Gagal", text: "Rusak" })
    );
    showErrorDialog("Rusak", "Ups");
    expect(fire).toHaveBeenLastCalledWith(expect.objectContaining({ title: "Ups" }));
  });

  it("menampilkan dialog peringatan dengan judul bawaan dan khusus", () => {
    showWarningDialog("Isi dulu");
    expect(fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ icon: "warning", title: "Perhatian" })
    );
    showWarningDialog("Isi dulu", "Awas");
    expect(fire).toHaveBeenLastCalledWith(expect.objectContaining({ title: "Awas" }));
  });

  it("mengembalikan true saat dikonfirmasi dan false saat dibatalkan", async () => {
    expect(await showConfirmDialog("Hapus?")).toBe(true);
    expect(fire).toHaveBeenLastCalledWith(
      expect.objectContaining({
        icon: "question",
        title: "Apakah Anda yakin?",
        confirmButtonText: "Ya, lanjutkan",
        showCancelButton: true,
      })
    );

    fire.mockResolvedValueOnce({ isConfirmed: false });
    expect(await showConfirmDialog("Hapus?", "Judul", "Hapus")).toBe(false);
    expect(fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: "Judul", confirmButtonText: "Hapus" })
    );
  });
});

describe("notify", () => {
  it("menampilkan dialog sukses untuk hasil berhasil", async () => {
    expect(await notify({ ok: true, message: "Selesai" })).toBe(true);
    expect(fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: "success" }));
  });

  it("menampilkan dialog galat untuk hasil gagal", async () => {
    expect(await notify({ ok: false, message: "Salah" })).toBe(false);
    expect(fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: "error" }));
  });
});

describe("formatDate", () => {
  it("memformat tanggal valid", () => {
    expect(formatDate("2026-02-03T00:00:00Z")).toContain("2026");
  });

  it("mengembalikan tanda hubung untuk nilai kosong", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate()).toBe("-");
  });
});

describe("averageRating", () => {
  it("mengembalikan 0 untuk daftar kosong", () => {
    expect(averageRating([])).toBe(0);
  });

  it("membulatkan rata-rata satu desimal", () => {
    expect(averageRating([{ rating: 4 }, { rating: 5 }])).toBe(4.5);
    expect(averageRating([{ rating: 5 }, { rating: 4 }, { rating: 4 }])).toBe(4.3);
  });
});

describe("getYoutubeEmbedUrl", () => {
  const embed = "https://www.youtube.com/embed/dQw4w9WgXcQ";

  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?list=x&v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
  ])("mengenali %s", (url) => {
    expect(getYoutubeEmbedUrl(url)).toBe(embed);
  });

  it("mengembalikan string kosong untuk tautan tidak valid", () => {
    expect(getYoutubeEmbedUrl("https://example.com/video")).toBe("");
    expect(getYoutubeEmbedUrl("")).toBe("");
  });
});

describe("pickFile", () => {
  it("mengambil berkas pertama dari input", () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    const input = document.createElement("input");
    input.type = "file";
    Object.defineProperty(input, "files", { value: [file] });

    let picked: File | undefined;
    input.addEventListener("change", (event) => {
      picked = pickFile(event);
    });
    input.dispatchEvent(new Event("change"));

    expect(picked).toBe(file);
  });
});
