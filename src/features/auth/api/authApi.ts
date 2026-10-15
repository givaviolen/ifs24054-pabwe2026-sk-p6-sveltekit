import { apiFetch } from "../../../helpers/apiHelper";

export interface User {
  id: string;
  name: string;
  email: string;
  photo?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const registerRequest = (input: RegisterInput) =>
  apiFetch<null>("/auth/register", { method: "POST", body: input, auth: false });

export const loginRequest = (input: LoginInput) =>
  apiFetch<{ token: string }>("/auth/login", {
    method: "POST",
    body: input,
    auth: false,
  });

export const fetchMe = () => apiFetch<{ user: User }>("/users/me");
