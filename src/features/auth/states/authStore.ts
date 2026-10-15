import { writable } from "svelte/store";
import {
  isSuccess,
  getAccessToken,
  putAccessToken,
  removeAccessToken,
  toResult,
  type ActionResult,
} from "../../../helpers/apiHelper";
import {
  fetchMe,
  loginRequest,
  registerRequest,
  type LoginInput,
  type RegisterInput,
  type User,
} from "../api/authApi";

export const token = writable<string | null>(null);
export const profile = writable<User | null>(null);
export const isLoggedIn = writable(false);
export const authLoading = writable(false);
export const sessionReady = writable(false);

/** Memulihkan sesi dari token yang tersimpan di localStorage. */
export async function restoreSession(): Promise<void> {
  const saved = getAccessToken();
  if (saved) {
    const me = await fetchMe();
    if (isSuccess(me)) {
      token.set(saved);
      profile.set(me.data.user);
      isLoggedIn.set(true);
    } else {
      removeAccessToken();
    }
  }
  sessionReady.set(true);
}

export async function login(input: LoginInput): Promise<ActionResult> {
  authLoading.set(true);
  const response = await loginRequest(input);
  if (!isSuccess(response)) {
    authLoading.set(false);
    return toResult(response);
  }

  putAccessToken(response.data.token);
  const me = await fetchMe();
  authLoading.set(false);
  if (!isSuccess(me)) {
    removeAccessToken();
    return toResult(me);
  }

  token.set(response.data.token);
  profile.set(me.data.user);
  isLoggedIn.set(true);
  return toResult(response);
}

export async function register(input: RegisterInput): Promise<ActionResult> {
  authLoading.set(true);
  const response = await registerRequest(input);
  authLoading.set(false);
  return toResult(response);
}

/** Memuat ulang profil setelah data pengguna diubah. */
export async function refreshProfile(): Promise<void> {
  const me = await fetchMe();
  if (isSuccess(me)) {
    profile.set(me.data.user);
  }
}

export function logout(): void {
  removeAccessToken();
  token.set(null);
  profile.set(null);
  isLoggedIn.set(false);
}
