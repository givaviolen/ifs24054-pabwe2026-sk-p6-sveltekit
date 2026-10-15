import { writable } from "svelte/store";
import {
  isSuccess,
  toResult,
  type ActionResult,
  type ApiResponse,
} from "../../../helpers/apiHelper";
import * as api from "../api/courseApi";
import type {
  ContentInput,
  Course,
  CourseContent,
  CourseInput,
} from "../api/courseApi";

export type MutationKey =
  | "add"
  | "change"
  | "cover"
  | "remove"
  | "removeAll"
  | "join"
  | "leave"
  | "rate"
  | "content"
  | "learn";

const idle: Record<MutationKey, boolean> = {
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
};

export const courses = writable<Course[]>([]);
export const course = writable<Course | null>(null);
export const content = writable<CourseContent | null>(null);
export const coursesLoading = writable(false);
export const courseLoading = writable(false);
export const contentLoading = writable(false);
export const mutating = writable<Record<MutationKey, boolean>>({ ...idle });

const normalize = (item: Course): Course => ({
  ...item,
  students: item.students ?? [],
  contents: item.contents ?? [],
  ratings: item.ratings ?? [],
});

// ---- Pemuatan data ----
export async function loadCourses(): Promise<ActionResult> {
  coursesLoading.set(true);
  const response = await api.getCourses();
  if (isSuccess(response)) {
    courses.set(response.data.courses.map(normalize));
  }
  coursesLoading.set(false);
  return toResult(response);
}

export async function loadCourse(id: string): Promise<ActionResult> {
  courseLoading.set(true);
  const response = await api.getCourse(id);
  course.set(isSuccess(response) ? normalize(response.data.course) : null);
  courseLoading.set(false);
  return toResult(response);
}

export async function loadContent(contentId: string): Promise<ActionResult> {
  contentLoading.set(true);
  const response = await api.getContent(contentId);
  content.set(isSuccess(response) ? response.data.course_content : null);
  contentLoading.set(false);
  return toResult(response);
}

// ---- Mutasi ----
async function mutate(
  key: MutationKey,
  request: () => Promise<ApiResponse>,
  after: () => Promise<unknown>
): Promise<ActionResult> {
  mutating.update((state) => ({ ...state, [key]: true }));
  const response = await request();
  if (isSuccess(response)) {
    await after();
  }
  mutating.update((state) => ({ ...state, [key]: false }));
  return toResult(response);
}

export const createCourse = (input: CourseInput) =>
  mutate("add", () => api.postCourse(input), () => loadCourses());

export const editCourse = (id: string, input: CourseInput) =>
  mutate("change", () => api.putCourse(id, input), () => loadCourse(id));

export const editCover = (id: string, file: File) =>
  mutate("cover", () => api.postCourseCover(id, file), () => loadCourse(id));

export const removeCourse = (id: string) =>
  mutate("remove", () => api.deleteCourse(id), async () => {
    courses.update((list) => list.filter((item) => item.id !== id));
  });

export const removeAllCourses = () =>
  mutate("removeAll", () => api.deleteAllCourses(), async () => {
    courses.set([]);
  });

export const joinCourse = (id: string) =>
  mutate("join", () => api.joinCourseRequest(id), () => loadCourse(id));

export const leaveCourse = (id: string) =>
  mutate("leave", () => api.leaveCourseRequest(id), () => loadCourse(id));

export const rateCourse = (id: string, rating: number) =>
  mutate("rate", () => api.postRating(id, rating), () => loadCourse(id));

export const addContent = (courseId: string, input: ContentInput) =>
  mutate("content", () => api.postContent(courseId, input), () => loadCourse(courseId));

export const editContent = (courseId: string, contentId: string, input: ContentInput) =>
  mutate("content", () => api.putContent(contentId, input), () => loadCourse(courseId));

export const removeContent = (courseId: string, contentId: string) =>
  mutate("content", () => api.deleteContent(contentId), () => loadCourse(courseId));

export const setLearned = (contentId: string, learned: boolean) =>
  mutate("learn", () => api.putLearned(contentId, learned ? 1 : 0), async () => {
    content.update((item) => ({ ...item, learned }) as CourseContent);
  });
