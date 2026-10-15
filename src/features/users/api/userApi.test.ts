import { describe, expect, it, vi } from "vitest";
import { apiFetch } from "../../../helpers/apiHelper";
import { fetchUsers, postPhoto, putPassword, putProfile } from "./userApi";

vi.mock("../../../helpers/apiHelper", () => ({ apiFetch: vi.fn() }));

describe("userApi", () => {
  it("fetchUsers memanggil GET /users", () => {
    fetchUsers();
    expect(apiFetch).toHaveBeenCalledWith("/users");
  });

  it("putProfile memanggil PUT /users/me", () => {
    putProfile({ name: "A", email: "a@b.c" });
    expect(apiFetch).toHaveBeenCalledWith("/users/me", {
      method: "PUT",
      body: { name: "A", email: "a@b.c" },
    });
  });

  it("postPhoto mengirim FormData berisi berkas foto", () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    postPhoto(file);

    const [path, options] = vi.mocked(apiFetch).mock.calls[0] as [string, any];
    expect(path).toBe("/users/photo");
    expect(options.method).toBe("POST");
    expect(options.form.get("photo")).toBe(file);
  });

  it("putPassword memanggil PUT /users/password", () => {
    putPassword({ password: "lama", new_password: "baru" });
    expect(apiFetch).toHaveBeenCalledWith("/users/password", {
      method: "PUT",
      body: { password: "lama", new_password: "baru" },
    });
  });
});
