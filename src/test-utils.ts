import { fireEvent, render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import type { User } from "./features/auth/api/authApi";
import {
  authLoading,
  isLoggedIn,
  profile,
  sessionReady,
  token,
} from "./features/auth/states/authStore";
import type { Course, CourseContent } from "./features/courses/api/courseApi";
import {
  content,
  contentLoading,
  course,
  courseLoading,
  courses,
  coursesLoading,
  mutating,
} from "./features/courses/states/coursesStore";
import { profileBusy, users, usersLoading } from "./features/users/states/usersStore";

export const testUser: User = {
  id: "u1",
  name: "Ayu Lestari",
  email: "ayu@example.com",
  photo: null,
  created_at: "2026-01-02T00:00:00Z",
};

export const makeCourse = (overrides: Partial<Course> = {}): Course => ({
  id: "c1",
  user_id: "u1",
  title: "Dasar Svelte",
  description: "Belajar Svelte dari nol",
  cover: null,
  students: [],
  contents: [],
  ratings: [],
  created_at: "2026-02-03T00:00:00Z",
  ...overrides,
});

export const makeContent = (overrides: Partial<CourseContent> = {}): CourseContent => ({
  id: "ct1",
  course_id: "c1",
  title: "Pengenalan Svelte",
  youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  learned: false,
  ...overrides,
});

export const ok = (data: any = null, message = "Berhasil") => ({
  status: "success",
  message,
  data,
});

export const fail = (message = "Gagal diproses") => ({
  status: "fail",
  message,
  data: null,
});

/** Mengembalikan semua store ke keadaan awal. */
export function resetStores() {
  token.set(null);
  profile.set(null);
  isLoggedIn.set(false);
  authLoading.set(false);
  sessionReady.set(false);
  courses.set([]);
  course.set(null);
  content.set(null);
  coursesLoading.set(false);
  courseLoading.set(false);
  contentLoading.set(false);
  mutating.set({
    add: false,
    change: false,
    cover: false,
    remove: false,
    removeAll: false,
    join: false,
    leave: false,
    rate: false,
    content: false,
    learn: false,
  });
  users.set([]);
  usersLoading.set(false);
  profileBusy.set(false);
}

interface ProviderOptions {
  user?: User;
  loggedIn?: boolean;
  ready?: boolean;
}

/** Merender komponen dengan store yang sudah diisi sesi pengguna. */
export function renderWithProviders(
  Component: any,
  props: Record<string, any> = {},
  options: ProviderOptions = {}
) {
  const { user = testUser, loggedIn = true, ready = true } = options;
  resetStores();
  if (loggedIn) {
    token.set("token-uji");
    profile.set(user);
    isLoggedIn.set(true);
  }
  sessionReady.set(ready);
  return render(Component, { props });
}

export const snippetOf = (html: string) =>
  createRawSnippet(() => ({ render: () => html }));

export const typeInto = (label: string | RegExp, value: string) =>
  fireEvent.input(screen.getByLabelText(label), { target: { value } });

export const submitForm = (testId: string) =>
  fireEvent.submit(screen.getByTestId(testId));

export const makeFile = (name = "gambar.png") =>
  new File(["isi"], name, { type: "image/png" });

import { tick } from "svelte";

export function deferred<T = any>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

/** Klik lewat element.click() agar listener Svelte 5 pasti dijalankan. */
export const click = async (element: HTMLElement) => {
  element.click();
  await tick();
};
