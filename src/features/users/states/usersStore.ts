import { writable } from "svelte/store";
import {
  isSuccess,
  toResult,
  type ActionResult,
  type ApiResponse,
} from "../../../helpers/apiHelper";
import type { User } from "../../auth/api/authApi";
import { refreshProfile } from "../../auth/states/authStore";
import {
  fetchUsers,
  postPhoto,
  putPassword,
  putProfile,
  type PasswordInput,
  type ProfileInput,
} from "../api/userApi";

export const users = writable<User[]>([]);
export const usersLoading = writable(false);
export const profileBusy = writable(false);

export async function loadUsers(): Promise<ActionResult> {
  usersLoading.set(true);
  const response = await fetchUsers();
  if (isSuccess(response)) {
    users.set(response.data.users);
  }
  usersLoading.set(false);
  return toResult(response);
}

async function mutateProfile(
  request: () => Promise<ApiResponse>,
  refresh: boolean
): Promise<ActionResult> {
  profileBusy.set(true);
  const response = await request();
  if (isSuccess(response) && refresh) {
    await refreshProfile();
  }
  profileBusy.set(false);
  return toResult(response);
}

export const saveProfile = (input: ProfileInput) =>
  mutateProfile(() => putProfile(input), true);

export const savePhoto = (file: File) =>
  mutateProfile(() => postPhoto(file), true);

export const savePassword = (input: PasswordInput) =>
  mutateProfile(() => putPassword(input), false);
