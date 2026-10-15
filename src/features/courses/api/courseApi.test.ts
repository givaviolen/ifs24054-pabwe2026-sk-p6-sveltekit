import { describe, expect, it, vi } from "vitest";
import { apiFetch } from "../../../helpers/apiHelper";
import * as api from "./courseApi";

vi.mock("../../../helpers/apiHelper", () => ({ apiFetch: vi.fn() }));

const lastCall = () => vi.mocked(apiFetch).mock.calls.at(-1) as [string, any];

describe("courseApi", () => {
  it("postCourse memanggil POST /courses", () => {
    api.postCourse({ title: "A", description: "B" });
    expect(apiFetch).toHaveBeenCalledWith("/courses", {
      method: "POST",
      body: { title: "A", description: "B" },
    });
  });

  it("postCourseCover mengirim FormData berisi cover", () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    api.postCourseCover("c1", file);
    const [path, options] = lastCall();
    expect(path).toBe("/courses/c1/cover");
    expect(options.method).toBe("POST");
    expect(options.form.get("cover")).toBe(file);
  });

  it("putCourse memanggil PUT /courses/:id", () => {
    api.putCourse("c1", { title: "A", description: "B" });
    expect(apiFetch).toHaveBeenCalledWith("/courses/c1", {
      method: "PUT",
      body: { title: "A", description: "B" },
    });
  });

  it("getCourses dan getCourse memanggil GET", () => {
    api.getCourses();
    expect(apiFetch).toHaveBeenCalledWith("/courses");
    api.getCourse("c1");
    expect(apiFetch).toHaveBeenCalledWith("/courses/c1");
  });

  it("deleteCourse dan deleteAllCourses memanggil DELETE", () => {
    api.deleteCourse("c1");
    expect(apiFetch).toHaveBeenCalledWith("/courses/c1", { method: "DELETE" });
    api.deleteAllCourses();
    expect(apiFetch).toHaveBeenCalledWith("/courses", { method: "DELETE" });
  });

  it("mengikuti dan keluar dari kursus", () => {
    api.joinCourseRequest("c1");
    expect(apiFetch).toHaveBeenCalledWith("/courses/c1/students", { method: "POST" });
    api.leaveCourseRequest("c1");
    expect(apiFetch).toHaveBeenCalledWith("/courses/c1/students", { method: "DELETE" });
  });

  it("postRating mengirim rating", () => {
    api.postRating("c1", 4);
    expect(apiFetch).toHaveBeenCalledWith("/courses/c1/ratings", {
      method: "POST",
      body: { rating: 4 },
    });
  });

  it("mengelola konten kursus", () => {
    const input = { title: "T", youtube: "https://youtu.be/dQw4w9WgXcQ" };
    api.postContent("c1", input);
    expect(apiFetch).toHaveBeenCalledWith("/courses/c1/contents", {
      method: "POST",
      body: input,
    });
    api.putContent("ct1", input);
    expect(apiFetch).toHaveBeenCalledWith("/courses/-/contents/ct1", {
      method: "PUT",
      body: input,
    });
    api.getContent("ct1");
    expect(apiFetch).toHaveBeenCalledWith("/courses/-/contents/ct1");
    api.deleteContent("ct1");
    expect(apiFetch).toHaveBeenCalledWith("/courses/-/contents/ct1", { method: "DELETE" });
  });

  it("putLearned mengirim status belajar 0 atau 1", () => {
    api.putLearned("ct1", 1);
    expect(apiFetch).toHaveBeenCalledWith("/courses/-/contents/ct1/learns", {
      method: "PUT",
      body: { status: 1 },
    });
    api.putLearned("ct1", 0);
    expect(lastCall()[1].body).toEqual({ status: 0 });
  });
});
