import { goto } from "$app/navigation";
import { render, screen, waitFor } from "@testing-library/svelte";
import Swal from "sweetalert2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deferred, fail, ok, resetStores, submitForm, testUser, typeInto } from "../../../test-utils";
import { fetchMe, loginRequest } from "../api/authApi";
import LoginPage from "./LoginPage.svelte";

vi.mock("../api/authApi", () => ({
  fetchMe: vi.fn(),
  loginRequest: vi.fn(),
  registerRequest: vi.fn(),
}));

const fire = Swal.fire as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetStores();
  render(LoginPage);
});

describe("LoginPage", () => {
  it("menampilkan formulir dan tautan daftar", () => {
    expect(screen.getByRole("heading", { name: "Masuk ke akunmu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Daftar" })).toHaveAttribute("href", "/auth/register");
  });

  it("memperingatkan bila email kosong", async () => {
    await submitForm("login-form");
    expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning" }));
    expect(loginRequest).not.toHaveBeenCalled();
  });

  it("memperingatkan bila kata sandi kosong", async () => {
    await typeInto("Email", "ayu@example.com");
    await submitForm("login-form");
    expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning" }));
    expect(loginRequest).not.toHaveBeenCalled();
  });

  it("menampilkan galat bila login gagal", async () => {
    vi.mocked(loginRequest).mockResolvedValue(fail("Email atau kata sandi salah"));
    await typeInto("Email", "ayu@example.com");
    await typeInto("Kata sandi", "rahasia");
    await submitForm("login-form");

    await waitFor(() =>
      expect(fire).toHaveBeenCalledWith(
        expect.objectContaining({ icon: "error", text: "Email atau kata sandi salah" })
      )
    );
    expect(goto).not.toHaveBeenCalled();
  });

  it("menampilkan status memproses lalu beralih ke beranda saat berhasil", async () => {
    const pending = deferred();
    vi.mocked(loginRequest).mockReturnValue(pending.promise);
    vi.mocked(fetchMe).mockResolvedValue(ok({ user: testUser }));
    await typeInto("Email", " ayu@example.com ");
    await typeInto("Kata sandi", "rahasia");
    await submitForm("login-form");

    const busy = await screen.findByRole("button", { name: "Memproses..." });
    expect(busy).toBeDisabled();

    pending.resolve(ok({ token: "tok" }, "Login berhasil"));
    await waitFor(() => expect(goto).toHaveBeenCalledWith("/"));
    expect(loginRequest).toHaveBeenCalledWith({ email: "ayu@example.com", password: "rahasia" });
  });
});
