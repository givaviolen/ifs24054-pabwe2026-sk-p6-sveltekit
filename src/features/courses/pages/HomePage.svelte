<script lang="ts">
  import { onMount } from "svelte";
  import { GraduationCap, Plus, Search, Star, Trash2, Users, Video } from "lucide-svelte";
  import { averageRating, notify, showConfirmDialog } from "../../../helpers/toolsHelper";
  import { profile } from "../../auth/states/authStore";
  import type { Course } from "../api/courseApi";
  import AddModal from "../modals/AddModal.svelte";
  import {
    courses,
    coursesLoading,
    loadCourses,
    mutating,
    removeAllCourses,
    removeCourse,
  } from "../states/coursesStore";

  let query = $state("");
  let onlyMine = $state(false);
  let showAdd = $state(false);

  const isMine = (item: Course) => item.user_id === $profile!.id;

  const filtered = $derived(
    $courses.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) &&
        (!onlyMine || isMine(item))
    )
  );
  const mineCount = $derived($courses.filter(isMine).length);

  onMount(() => {
    loadCourses();
  });

  async function handleDelete(item: Course) {
    if (await showConfirmDialog(`Kursus "${item.title}" akan dihapus permanen.`)) {
      await notify(await removeCourse(item.id));
    }
  }

  async function handleDeleteAll() {
    if (await showConfirmDialog("Semua kursus milik Anda akan dihapus permanen.")) {
      await notify(await removeAllCourses());
    }
  }
</script>

<section>
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold">Semua Kursus</h1>
      <p class="text-sm text-slate-500">Temukan kursus untuk dipelajari atau kelola kursusmu sendiri.</p>
    </div>
    <div class="flex gap-2">
      {#if mineCount > 0}
        <button type="button" disabled={$mutating.removeAll} onclick={handleDeleteAll} class="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
          <Trash2 class="h-4 w-4" />
          Hapus semua milik saya
        </button>
      {/if}
      <button type="button" onclick={() => (showAdd = true)} class="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
        <Plus class="h-4 w-4" />
        Tambah kursus
      </button>
    </div>
  </div>

  <div class="mt-5 flex flex-wrap items-center gap-4">
    <div class="relative w-full sm:w-80">
      <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      <input type="search" aria-label="Cari kursus" placeholder="Cari judul kursus" bind:value={query} class="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
    </div>
    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" bind:checked={onlyMine} class="h-4 w-4 rounded border-slate-300" />
      Hanya milik saya
    </label>
  </div>

  {#if $coursesLoading}
    <p class="mt-12 text-center text-slate-500">Memuat kursus...</p>
  {:else if filtered.length === 0}
    <p class="mt-12 text-center text-slate-500">Belum ada kursus yang cocok. Coba kata kunci lain atau buat kursus baru.</p>
  {:else}
    <ul class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each filtered as item (item.id)}
        <li class="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          {#if item.cover}
            <img src={item.cover} alt={`Sampul ${item.title}`} class="h-36 w-full object-cover" />
          {:else}
            <div class="flex h-36 items-center justify-center bg-indigo-50 text-indigo-300">
              <GraduationCap class="h-12 w-12" />
            </div>
          {/if}
          <div class="flex flex-1 flex-col p-4">
            <a href={`/courses/${item.id}`} class="font-bold hover:text-indigo-700">{item.title}</a>
            <p class="mt-1 line-clamp-2 text-sm text-slate-500">{item.description}</p>
            <div class="mt-auto flex items-center gap-4 pt-4 text-xs text-slate-500">
              <span class="flex items-center gap-1"><Users class="h-3.5 w-3.5" />{item.students.length}</span>
              <span class="flex items-center gap-1"><Video class="h-3.5 w-3.5" />{item.contents.length}</span>
              <span class="flex items-center gap-1"><Star class="h-3.5 w-3.5" />{averageRating(item.ratings)}</span>
              {#if isMine(item)}
                <button type="button" aria-label={`Hapus ${item.title}`} disabled={$mutating.remove} onclick={() => handleDelete(item)} class="ml-auto rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-60">
                  <Trash2 class="h-4 w-4" />
                </button>
              {/if}
            </div>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

{#if showAdd}
  <AddModal onclose={() => (showAdd = false)} />
{/if}
