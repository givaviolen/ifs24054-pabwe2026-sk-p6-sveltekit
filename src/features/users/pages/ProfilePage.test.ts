import { fireEvent, screen, waitFor } from "@testing-library/svelte";
import Swal from "sweetalert2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fail,
  makeFile,
  ok,
  renderWithProviders,
  submitForm,
  testUser,
  typeInto,
} from "../../../test-utils";
import { fetchMe } from "../../auth/api/authApi";
import { postPhoto, putPassword, putProfile } from "../api/userApi";
import ProfilePage from "./ProfilePage.svelte";

vi.mock("../../auth/api/authApi", () => ({
  fetchMe: vi.fn(),
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
}));
vi.mock("../api/userApi", () => ({
  fetchUsers: vi.fn(),
  postPhoto: vi.fn(),
  putPassword: vi.fn(),
  putProfile: vi.fn(),
}));

const fire = Swal.fire as unknown as ReturnType<typeof vi.fn>;
const warned = () =>
  expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning" }));

beforeEach(() => {
  vi.mocked(fetchMe).mockResolvedValue(ok({ user: { ...testUser, name: "Ayu Baru" } }));
});

describe("tampilan", () => {
  it("menampilkan inisial bila belum ada foto", () => {
    renderWithProviders(ProfilePage);
    expect(screen.getByRole("heading", { name: "Ayu Lestari" })).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByLabelText("Nama")).toHaveValue("Ayu Lestari");
    expect(screen.getByLabelText("Email")).toHaveValue("ayu@example.com");
  });

  it("menampilkan foto bila tersedia", () => {
    renderWithProviders(ProfilePage, {}, { user: { ...testUser, photo: "https://img.test/a.png" } });
    expect(screen.getByRole("img", { name: "Ayu Lestari" })).toHaveAttribute("src", "https://img.test/a.png");
  });
});

describe("ubah data diri", () => {
  it.each([
    ["nama", "Nama"],
    ["email", "Email"],
  ])("memperingatkan bila %s kosong", async (_name, label) => {
    renderWithProviders(ProfilePage);
    await typeInto(label, "  ");
    await submitForm("profile-form");
    warned();
    expect(putProfile).not.toHaveBeenCalled();
  });

  it("menyimpan data diri dan memuat ulang profil", async () => {
    vi.mocked(putProfile).mockResolvedValue(ok(null, "Profil diperbarui"));
    renderWithProviders(ProfilePage);
    await typeInto("Nama", "Ayu Baru");
    await submitForm("profile-form");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Ayu Baru" })).toBeInTheDocument()
    );
    expect(putProfile).toHaveBeenCalledWith({ name: "Ayu Baru", email: "ayu@example.com" });
    expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "success" }));
  });
});

describe("unggah foto", () => {
  it("memperingatkan bila belum memilih foto", async () => {
    renderWithProviders(ProfilePage);
    await submitForm("photo-form");
    warned();
    expect(postPhoto).not.toHaveBeenCalled();
  });

  it("mengunggah foto yang dipilih", async () => {
    vi.mocked(postPhoto).mockResolvedValue(ok(null, "Foto diperbarui"));
    renderWithProviders(ProfilePage);
    const file = makeFile();
    await fireEvent.change(screen.getByLabelText("Pilih foto"), { target: { files: [file] } });
    await submitForm("photo-form");

    await waitFor(() => expect(postPhoto).toHaveBeenCalledWith(file));
  });
});

describe("ubah kata sandi", () => {
  const fill = async (current: string, next: string, confirm: string) => {
    await typeInto("Kata sandi lama", current);
    await typeInto("Kata sandi baru", next);
    await typeInto("Ulangi kata sandi baru", confirm);
  };

  it("memperingatkan bila kata sandi lama kosong", async () => {
    renderWithProviders(ProfilePage);
    await submitForm("password-form");
    warned();
    expect(putPassword).not.toHaveBeenCalled();
  });

  it("memperingatkan bila kata sandi baru kosong", async () => {
    renderWithProviders(ProfilePage);
    await typeInto("Kata sandi lama", "lama");
    await submitForm("password-form");
    warned();
    expect(putPassword).not.toHaveBeenCalled();
  });

  it("memperingatkan bila konfirmasi berbeda", async () => {
    renderWithProviders(ProfilePage);
    await fill("lama", "baru", "beda");
    await submitForm("password-form");
    warned();
    expect(putPassword).not.toHaveBeenCalled();
  });

  it("mengosongkan formulir setelah berhasil", async () => {
    vi.mocked(putPassword).mockResolvedValue(ok(null, "Kata sandi diubah"));
    renderWithProviders(ProfilePage);
    await fill("lama", "baru", "baru");
    await submitForm("password-form");

    await waitFor(() => expect(screen.getByLabelText("Kata sandi lama")).toHaveValue(""));
    expect(putPassword).toHaveBeenCalledWith({ password: "lama", new_password: "baru" });
    expect(screen.getByLabelText("Kata sandi baru")).toHaveValue("");
    expect(screen.getByLabelText("Ulangi kata sandi baru")).toHaveValue("");
  });

  it("mempertahankan isian bila gagal", async () => {
    vi.mocked(putPassword).mockResolvedValue(fail("Kata sandi lama salah"));
    renderWithProviders(ProfilePage);
    await fill("lama", "baru", "baru");
    await submitForm("password-form");

    await waitFor(() =>
      expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error" }))
    );
    expect(screen.getByLabelText("Kata sandi lama")).toHaveValue("lama");
  });
});
