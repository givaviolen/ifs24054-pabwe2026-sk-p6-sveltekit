<script lang="ts">
  import { GraduationCap } from "lucide-svelte";

  let { children } = $props();
</script>

<div class="grid min-h-screen lg:grid-cols-2">
  <aside class="hidden flex-col justify-between bg-indigo-700 p-12 text-white lg:flex">
    <div class="flex items-center gap-3">
      <GraduationCap class="h-8 w-8" />
      <span class="text-xl font-bold">Delcom Courses</span>
    </div>
    <div>
      <h1 class="text-4xl font-extrabold leading-tight">
        Belajar lewat kursus video, sesuai kecepatanmu sendiri.
      </h1>
      <p class="mt-4 max-w-md text-indigo-100">
        Ikuti kursus, tonton materi YouTube, dan tandai yang sudah selesai.
        Atau buat kursusmu sendiri dan undang peserta untuk belajar bersama.
      </p>
    </div>
    <p class="text-sm text-indigo-200">Praktikum PABWE 2026</p>
  </aside>

  <main class="flex items-center justify-center p-6">
    <div class="w-full max-w-md">
      <div class="mb-8 flex items-center gap-2 text-indigo-700 lg:hidden">
        <GraduationCap class="h-7 w-7" />
        <span class="text-lg font-bold">Delcom Courses</span>
      </div>
      {@render children()}
    </div>
  </main>
</div>
