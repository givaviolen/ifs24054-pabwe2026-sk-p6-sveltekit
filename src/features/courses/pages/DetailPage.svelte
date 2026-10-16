<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { GraduationCap, Image, Lock, Pencil, Play, Plus, Star, Trash2 } from "lucide-svelte";
  import { averageRating, cn, formatDate, notify, showConfirmDialog } from "../../../helpers/toolsHelper";
  import { profile } from "../../auth/states/authStore";
  import type { CourseContent } from "../api/courseApi";
  import ChangeCoverModal from "../modals/ChangeCoverModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import ContentModal from "../modals/ContentModal.svelte";
  import {
    course,
    courseLoading,
    joinCourse,
    leaveCourse,
    loadCourse,
    mutating,
    rateCourse,
    removeContent,
    removeCourse,
  } from "../states/coursesStore";

  let { courseId }: { courseId: string } = $props();

  let showChange = $state(false);
  let showCover = $state(false);
  let showContent = $state(false);
  let editingContent = $state<CourseContent | null>(null);

  // Pemilik: user_id kursus sama dengan id profil. Peserta: id profil ada di students.
  const isOwner = $derived($course !== null && $course.user_id === $profile!.id);
  const isStudent = $derived(
    $course !== null && $course.students.some((student) => student.id === $profile!.id)
  );
  // Antarmuka pemilik didahulukan bila keduanya terpenuhi.
  const role = $derived(isOwner ? "owner" : isStudent ? "student" : "visitor");
  const myRating = $derived(
    $course?.ratings.find((item) => item.user_id === $profile!.id)?.rating ?? 0
  );

  onMount(() => {
    course.set(null);
    loadCourse(courseId);
  });

  function openContentModal(item: CourseContent | null) {
    editingContent = item;
    showContent = true;
  }

  async function handleDelete() {
    if (await showConfirmDialog("Kursus ini akan dihapus permanen.")) {
      if (await notify(await removeCourse(courseId))) {
        await goto("/");
      }
    }
  }

  async function handleDeleteContent(item: CourseContent) {
    if (await showConfirmDialog(`Materi "${item.title}" akan dihapus.`)) {
      await notify(await removeContent(courseId, item.id));
    }
  }
</script>

{#if $courseLoading && !$course}
  <h1 class="py-16 text-center text-base font-normal text-slate-500">Memuat kursus...</h1>
{:else if !$course}
  <div class="py-16 text-center">
    <h1 class="text-base font-semibold">Kursus tidak ditemukan</h1>
    <a href="/" class="mt-2 inline-block text-sm text-indigo-600 hover:underline">Kembali ke Semua Kursus</a>
  </div>
{:else}
  <article class="space-y-6">
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {#if $course.cover}
        <img
          src={$course.cover}
          alt={`Sampul ${$course.title}`}
          width="1024"
          height="224"
          fetchpriority="high"
          decoding="async"
          class="h-56 w-full object-cover"
        />
      {:else}
        <div class="flex h-56 items-center justify-center bg-indigo-50 text-indigo-300">
          <GraduationCap class="h-16 w-16" />
        </div>
      {/if}
      <div class="space-y-3 p-5">
        <h1 class="text-2xl font-bold">{$course.title}</h1>
        <p class="whitespace-pre-wrap text-slate-600">{$course.description}</p>
        <p class="flex items-center gap-1 text-sm text-slate-500">
          <Star class="h-4 w-4" />
          {averageRating($course.ratings)} dari {$course.ratings.length} rating · {$course.students.length} peserta · dibuat {formatDate($course.created_at)}
        </p>

        {#if role === "owner"}
          <div class="flex flex-wrap gap-2 pt-2">
            <button type="button" onclick={() => (showChange = true)} class="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">
              <Pencil class="h-4 w-4" /> Ubah data
            </button>
            <button type="button" onclick={() => (showCover = true)} class="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">
              <Image class="h-4 w-4" /> Ubah sampul
            </button>
            <button type="button" disabled={$mutating.remove} onclick={handleDelete} class="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60">
              <Trash2 class="h-4 w-4" /> Hapus kursus
            </button>
          </div>
        {:else if role === "student"}
          <div class="space-y-3 pt-2">
            <div class="flex items-center gap-1" role="group" aria-label="Beri rating">
              {#each [1, 2, 3, 4, 5] as value (value)}
                <button
                  type="button"
                  aria-label={`Beri rating ${value}`}
                  disabled={$mutating.rate}
                  onclick={async () => notify(await rateCourse(courseId, value))}
                  class="rounded p-1 hover:bg-amber-50"
                >
                  <Star class={cn("h-6 w-6", value <= myRating ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                </button>
              {/each}
            </div>
            <button type="button" disabled={$mutating.leave} onclick={async () => notify(await leaveCourse(courseId))} class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60">
              Keluar dari kursus
            </button>
          </div>
        {:else}
          <button type="button" disabled={$mutating.join} onclick={async () => notify(await joinCourse(courseId))} class="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            Ikuti kursus
          </button>
        {/if}
      </div>
    </div>

    <section class="rounded-xl border border-slate-200 bg-white p-5">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold">Daftar materi</h2>
        {#if role === "owner"}
          <button type="button" onclick={() => openContentModal(null)} class="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus class="h-4 w-4" /> Tambah materi
          </button>
        {/if}
      </div>

      {#if $course.contents.length === 0}
        <p class="mt-4 text-sm text-slate-500">Belum ada materi di kursus ini.</p>
      {:else}
        <ul class="mt-4 divide-y divide-slate-100">
          {#each $course.contents as item (item.id)}
            <li class="flex items-center gap-3 py-3">
              {#if role === "visitor"}
                <span class="flex flex-1 items-center gap-2 text-slate-400">
                  <Lock class="h-4 w-4" />{item.title}
                </span>
              {:else}
                <a href={`/courses/${courseId}/contents/${item.id}`} class="flex flex-1 items-center gap-2 font-medium hover:text-indigo-700">
                  <Play class="h-4 w-4" />{item.title}
                </a>
              {/if}
              {#if role === "owner"}
                <button type="button" aria-label={`Ubah ${item.title}`} onclick={() => openContentModal(item)} class="rounded-lg p-1.5 hover:bg-slate-100">
                  <Pencil class="h-4 w-4" />
                </button>
                <button type="button" aria-label={`Hapus ${item.title}`} disabled={$mutating.content} onclick={() => handleDeleteContent(item)} class="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60">
                  <Trash2 class="h-4 w-4" />
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    {#if role === "owner"}
      <section class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="text-lg font-bold">Peserta</h2>
        {#if $course.students.length === 0}
          <p class="mt-4 text-sm text-slate-500">Belum ada peserta.</p>
        {:else}
          <ul class="mt-4 space-y-2 text-sm">
            {#each $course.students as student (student.id)}
              <li>{student.name ?? student.id}</li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}
  </article>

  {#if showChange}
    <ChangeModal course={$course} onclose={() => (showChange = false)} />
  {/if}
  {#if showCover}
    <ChangeCoverModal {courseId} onclose={() => (showCover = false)} />
  {/if}
  {#if showContent}
    <ContentModal {courseId} content={editingContent} onclose={() => (showContent = false)} />
  {/if}
{/if}