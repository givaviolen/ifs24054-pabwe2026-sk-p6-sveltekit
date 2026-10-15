import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fail, makeContent, makeCourse, makeFile, ok, resetStores } from "../../../test-utils";
import * as api from "../api/courseApi";
import {
  addContent,
  content,
  contentLoading,
  course,
  courseLoading,
  courses,
  coursesLoading,
  createCourse,
  editContent,
  editCourse,
  editCover,
  joinCourse,
  leaveCourse,
  loadContent,
  loadCourse,
  loadCourses,
  mutating,
  rateCourse,
  removeAllCourses,
  removeContent,
  removeCourse,
  setLearned,
} from "./coursesStore";

vi.mock("../api/courseApi");

const detail = makeCourse({ id: "c1", title: "Detail" });

beforeEach(() => {
  resetStores();
  vi.mocked(api.getCourses).mockResolvedValue(ok({ courses: [] }));
  vi.mocked(api.getCourse).mockResolvedValue(ok({ course: detail }));
});

describe("pemuatan data", () => {
  it("loadCourses mengisi koleksi dan melengkapi larik yang hilang", async () => {
    const partial = { id: "c2", user_id: "u2", title: "Tanpa larik", description: "" } as any;
    vi.mocked(api.getCourses).mockResolvedValue(
      ok({ courses: [makeCourse({ students: [{ id: "u9" }] }), partial] })
    );

    const result = await loadCourses();

    expect(result.ok).toBe(true);
    const list = get(courses);
    expect(list).toHaveLength(2);
    expect(list[0].students).toEqual([{ id: "u9" }]);
    expect(list[1].students).toEqual([]);
    expect(list[1].contents).toEqual([]);
    expect(list[1].ratings).toEqual([]);
    expect(get(coursesLoading)).toBe(false);
  });

  it("loadCourses membiarkan koleksi bila gagal", async () => {
    vi.mocked(api.getCourses).mockResolvedValue(fail("Gagal memuat"));

    const result = await loadCourses();

    expect(result).toEqual({ ok: false, message: "Gagal memuat" });
    expect(get(courses)).toEqual([]);
  });

  it("loadCourse mengisi detail kursus", async () => {
    const result = await loadCourse("c1");

    expect(result.ok).toBe(true);
    expect(get(course)?.title).toBe("Detail");
    expect(get(courseLoading)).toBe(false);
  });

  it("loadCourse mengosongkan detail bila gagal", async () => {
    course.set(detail);
    vi.mocked(api.getCourse).mockResolvedValue(fail("Tidak ditemukan"));

    const result = await loadCourse("zzz");

    expect(result.ok).toBe(false);
    expect(get(course)).toBeNull();
  });

  it("loadContent mengisi konten, atau mengosongkannya bila gagal", async () => {
    const item = makeContent();
    vi.mocked(api.getContent).mockResolvedValue(ok({ course_content: item }));
    expect((await loadContent("ct1")).ok).toBe(true);
    expect(get(content)).toEqual(item);
    expect(get(contentLoading)).toBe(false);

    vi.mocked(api.getContent).mockResolvedValue(fail("Tidak ada"));
    expect((await loadContent("ct1")).ok).toBe(false);
    expect(get(content)).toBeNull();
  });
});

describe("mutasi kursus", () => {
  it("createCourse memuat ulang daftar setelah berhasil", async () => {
    vi.mocked(api.postCourse).mockResolvedValue(ok({ course_id: "c9" }, "Dibuat"));

    const result = await createCourse({ title: "A", description: "B" });

    expect(result).toEqual({ ok: true, message: "Dibuat" });
    expect(api.postCourse).toHaveBeenCalledWith({ title: "A", description: "B" });
    expect(api.getCourses).toHaveBeenCalledTimes(1);
  });

  it("tidak menjalankan tindak lanjut bila permintaan gagal", async () => {
    vi.mocked(api.postCourse).mockResolvedValue(fail("Judul wajib"));

    const result = await createCourse({ title: "", description: "" });

    expect(result).toEqual({ ok: false, message: "Judul wajib" });
    expect(api.getCourses).not.toHaveBeenCalled();
    expect(get(mutating).add).toBe(false);
  });

  it("menyalakan penanda mutasi selama permintaan berjalan", async () => {
    let finish: (value: unknown) => void = () => {};
    vi.mocked(api.postCourse).mockReturnValue(new Promise((resolve) => (finish = resolve)) as any);

    const pending = createCourse({ title: "A", description: "" });
    expect(get(mutating).add).toBe(true);

    finish(fail());
    await pending;
    expect(get(mutating).add).toBe(false);
  });

  it("editCourse dan editCover memuat ulang detail", async () => {
    vi.mocked(api.putCourse).mockResolvedValue(ok());
    vi.mocked(api.postCourseCover).mockResolvedValue(ok());
    const file = makeFile();

    await editCourse("c1", { title: "A", description: "B" });
    await editCover("c1", file);

    expect(api.putCourse).toHaveBeenCalledWith("c1", { title: "A", description: "B" });
    expect(api.postCourseCover).toHaveBeenCalledWith("c1", file);
    expect(api.getCourse).toHaveBeenCalledTimes(2);
  });

  it("removeCourse membuang kursus dari koleksi", async () => {
    courses.set([makeCourse({ id: "c1" }), makeCourse({ id: "c2" })]);
    vi.mocked(api.deleteCourse).mockResolvedValue(ok());

    await removeCourse("c1");

    expect(get(courses).map((item) => item.id)).toEqual(["c2"]);
  });

  it("removeAllCourses mengosongkan koleksi", async () => {
    courses.set([makeCourse()]);
    vi.mocked(api.deleteAllCourses).mockResolvedValue(ok());

    await removeAllCourses();

    expect(get(courses)).toEqual([]);
  });
});

describe("mutasi peserta dan rating", () => {
  it("joinCourse, leaveCourse, dan rateCourse memuat ulang detail", async () => {
    vi.mocked(api.joinCourseRequest).mockResolvedValue(ok());
    vi.mocked(api.leaveCourseRequest).mockResolvedValue(ok());
    vi.mocked(api.postRating).mockResolvedValue(ok());

    await joinCourse("c1");
    await leaveCourse("c1");
    await rateCourse("c1", 5);

    expect(api.joinCourseRequest).toHaveBeenCalledWith("c1");
    expect(api.leaveCourseRequest).toHaveBeenCalledWith("c1");
    expect(api.postRating).toHaveBeenCalledWith("c1", 5);
    expect(api.getCourse).toHaveBeenCalledTimes(3);
  });
});

describe("mutasi konten", () => {
  const input = { title: "T", youtube: "https://youtu.be/dQw4w9WgXcQ" };

  it("addContent, editContent, dan removeContent memuat ulang detail", async () => {
    vi.mocked(api.postContent).mockResolvedValue(ok());
    vi.mocked(api.putContent).mockResolvedValue(ok());
    vi.mocked(api.deleteContent).mockResolvedValue(ok());

    await addContent("c1", input);
    await editContent("c1", "ct1", input);
    await removeContent("c1", "ct1");

    expect(api.postContent).toHaveBeenCalledWith("c1", input);
    expect(api.putContent).toHaveBeenCalledWith("ct1", input);
    expect(api.deleteContent).toHaveBeenCalledWith("ct1");
    expect(api.getCourse).toHaveBeenCalledTimes(3);
  });

  it("setLearned mengirim status 1 atau 0 dan memperbarui konten", async () => {
    content.set(makeContent({ learned: false }));
    vi.mocked(api.putLearned).mockResolvedValue(ok());

    await setLearned("ct1", true);
    expect(api.putLearned).toHaveBeenLastCalledWith("ct1", 1);
    expect(get(content)?.learned).toBe(true);

    await setLearned("ct1", false);
    expect(api.putLearned).toHaveBeenLastCalledWith("ct1", 0);
    expect(get(content)?.learned).toBe(false);
  });
});
