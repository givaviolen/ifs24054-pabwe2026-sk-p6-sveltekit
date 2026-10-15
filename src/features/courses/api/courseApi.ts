import { apiFetch } from "../../../helpers/apiHelper";

export interface CourseStudent {
  id: string;
  name?: string;
  email?: string;
  photo?: string | null;
}

export interface CourseRating {
  id?: string;
  user_id: string;
  rating: number;
}

export interface CourseContent {
  id: string;
  course_id?: string;
  title: string;
  youtube: string;
  learned?: boolean;
  created_at?: string;
}

export interface Course {
  id: string;
  user_id: string;
  title: string;
  description: string;
  cover?: string | null;
  students: CourseStudent[];
  contents: CourseContent[];
  ratings: CourseRating[];
  created_at?: string;
  updated_at?: string;
}

export interface CourseInput {
  title: string;
  description: string;
}

export interface ContentInput {
  title: string;
  youtube: string;
}

// ---- Kursus ----
export const postCourse = (input: CourseInput) =>
  apiFetch<{ course_id: string }>("/courses", { method: "POST", body: input });

export const postCourseCover = (id: string, file: File) => {
  const form = new FormData();
  form.append("cover", file);
  return apiFetch(`/courses/${id}/cover`, { method: "POST", form });
};

export const putCourse = (id: string, input: CourseInput) =>
  apiFetch(`/courses/${id}`, { method: "PUT", body: input });

export const getCourses = () => apiFetch<{ courses: Course[] }>("/courses");

export const getCourse = (id: string) =>
  apiFetch<{ course: Course }>(`/courses/${id}`);

export const deleteCourse = (id: string) =>
  apiFetch(`/courses/${id}`, { method: "DELETE" });

export const deleteAllCourses = () => apiFetch("/courses", { method: "DELETE" });

// ---- Peserta ----
export const joinCourseRequest = (id: string) =>
  apiFetch(`/courses/${id}/students`, { method: "POST" });

export const leaveCourseRequest = (id: string) =>
  apiFetch(`/courses/${id}/students`, { method: "DELETE" });

// ---- Rating (skala 1 sampai 5) ----
export const postRating = (id: string, rating: number) =>
  apiFetch(`/courses/${id}/ratings`, { method: "POST", body: { rating } });

// ---- Konten ----
export const postContent = (courseId: string, input: ContentInput) =>
  apiFetch(`/courses/${courseId}/contents`, { method: "POST", body: input });

export const putContent = (contentId: string, input: ContentInput) =>
  apiFetch(`/courses/-/contents/${contentId}`, { method: "PUT", body: input });

export const getContent = (contentId: string) =>
  apiFetch<{ course_content: CourseContent }>(`/courses/-/contents/${contentId}`);

export const deleteContent = (contentId: string) =>
  apiFetch(`/courses/-/contents/${contentId}`, { method: "DELETE" });

/** Status belajar: 0 = belum selesai, 1 = selesai. */
export const putLearned = (contentId: string, status: 0 | 1) =>
  apiFetch(`/courses/-/contents/${contentId}/learns`, {
    method: "PUT",
    body: { status },
  });
