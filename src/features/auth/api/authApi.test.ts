import { describe, expect, it, vi } from "vitest";
import { apiFetch } from "../../../helpers/apiHelper";
import { fetchMe, loginRequest, registerRequest } from "./authApi";

vi.mock("../../../helpers/apiHelper", () => ({ apiFetch: vi.fn() }));

describe("authApi", () => {
  it("registerRequest memanggil POST /auth/register tanpa token", () => {
    const input = { name: "A", email: "a@b.c", password: "123456" };
    registerRequest(input);
    expect(apiFetch).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      body: input,
      auth: false,
    });
  });

  it("loginRequest memanggil POST /auth/login tanpa token", () => {
    const input = { email: "a@b.c", password: "123456" };
    loginRequest(input);
    expect(apiFetch).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: input,
      auth: false,
    });
  });

  it("fetchMe memanggil GET /users/me", () => {
    fetchMe();
    expect(apiFetch).toHaveBeenCalledWith("/users/me");
  });
});
