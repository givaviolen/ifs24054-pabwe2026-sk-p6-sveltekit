import { apiFetch } from "../../../helpers/apiHelper";
import type { User } from "../../auth/api/authApi";

export interface ProfileInput {
  name: string;
  email: string;
}

export interface PasswordInput {
  password: string;
  new_password: string;
}

export const fetchUsers = () => apiFetch<{ users: User[] }>("/users");

export const putProfile = (input: ProfileInput) =>
  apiFetch("/users/me", { method: "PUT", body: input });

export const postPhoto = (file: File) => {
  const form = new FormData();
  form.append("photo", file);
  return apiFetch("/users/photo", { method: "POST", form });
};

export const putPassword = (input: PasswordInput) =>
  apiFetch("/users/password", { method: "PUT", body: input });
