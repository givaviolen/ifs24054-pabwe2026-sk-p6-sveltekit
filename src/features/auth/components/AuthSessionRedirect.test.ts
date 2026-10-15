import { goto } from "$app/navigation";
import { render, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { describe, expect, it } from "vitest";
import { renderWithProviders, resetStores, testUser } from "../../../test-utils";
import { isLoggedIn, profile, token } from "../states/authStore";
import AuthSessionRedirect from "./AuthSessionRedirect.svelte";

describe("AuthSessionRedirect", () => {
  it.each([
    ["token kosong", () => { isLoggedIn.set(true); profile.set(testUser); }],
    ["belum berstatus login", () => { token.set("t"); profile.set(testUser); }],
    ["profil belum siap", () => { token.set("t"); isLoggedIn.set(true); }],
  ])("tidak mengalihkan bila %s", async (_label, prepare) => {
    resetStores();
    prepare();
    render(AuthSessionRedirect);
    await tick();
    expect(goto).not.toHaveBeenCalled();
  });

  it("mengalihkan ke beranda bila token, status login, dan profil siap", async () => {
    renderWithProviders(AuthSessionRedirect);
    await waitFor(() => expect(goto).toHaveBeenCalledWith("/"));
  });
});
