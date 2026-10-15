import { goto } from "$app/navigation";
import { render, screen, waitFor } from "@testing-library/svelte";
import Swal from "sweetalert2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deferred, fail, ok, resetStores, submitForm, typeInto } from "../../../test-utils";
import { registerRequest } from "../api/authApi";
import RegisterPage from "./RegisterPage.svelte";

vi.mock("../api/authApi", () => ({
  fetchMe: vi.fn(),
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
}));

const fire = Swal.fire as unknown as ReturnType<typeof vi.fn>;

const fillForm = async (confirm = "rahasia") => {
  await typeInto("Nama", "Ayu");
  await typeInto("Email", "ayu@example.com");
  await typeInto("Kata sandi", "rahasia");
  await typeInto("Ulangi kata sandi", confirm);
};

beforeEach(() => {
  resetStores();
  render(RegisterPage);
});

describe("RegisterPage", () => {
  it("menampilkan formulir dan tautan masuk", () => {
    expect(screen.getByRole("heading", { name: "Buat akun baru" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Masuk" })).toHaveAttribute("href", "/auth/login");
  });

  it("memperingatkan bila ada kolom wajib yang kosong", async () => {
    await submitForm("register-form");
    expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning" }));
    expect(registerRequest).not.toHaveBeenCalled();
  });

  it.each([
    ["nama", "Nama"],
    ["email", "Email"],
  ])("memperingatkan bila %s dikosongkan", async (_name, label) => {
    await fillForm();
    await typeInto(label, "   ");
    await submitForm("register-form");
    expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning" }));
    expect(registerRequest).not.toHaveBeenCalled();
  });

  it("memperingatkan bila konfirmasi kata sandi berbeda", async () => {
    await fillForm("beda");
    await submitForm("register-form");
    expect(fire).toHaveBeenCalledWith(
      expect.objectContaining({ icon: "warning", text: "Konfirmasi kata sandi tidak sama." })
    );
    expect(registerRequest).not.toHaveBeenCalled();
  });

  it("menampilkan galat dan tetap di halaman bila pendaftaran gagal", async () => {
    vi.mocked(registerRequest).mockResolvedValue(fail("Email sudah dipakai"));
    await fillForm();
    await submitForm("register-form");

    await waitFor(() =>
      expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error" }))
    );
    expect(goto).not.toHaveBeenCalled();
  });

  it("menampilkan status memproses lalu beralih ke halaman login saat berhasil", async () => {
    const pending = deferred();
    vi.mocked(registerRequest).mockReturnValue(pending.promise);
    await fillForm();
    await submitForm("register-form");

    expect(await screen.findByRole("button", { name: "Memproses..." })).toBeDisabled();

    pending.resolve(ok(null, "Akun dibuat"));
    await waitFor(() => expect(goto).toHaveBeenCalledWith("/auth/login"));
    expect(registerRequest).toHaveBeenCalledWith({
      name: "Ayu",
      email: "ayu@example.com",
      password: "rahasia",
    });
  });
});
