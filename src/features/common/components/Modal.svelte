<script lang="ts">
  import { X } from "lucide-svelte";
  import type { Snippet } from "svelte";

  let {
    title,
    onclose,
    children,
  }: { title: string; onclose: () => void; children: Snippet } = $props();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <button
    type="button"
    aria-label="Tutup latar"
    class="absolute inset-0 bg-slate-900/50"
    onclick={onclose}
  ></button>
  <div
    role="dialog"
    aria-modal="true"
    aria-label={title}
    class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
  >
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-bold">{title}</h2>
      <button type="button" aria-label="Tutup dialog" class="rounded-lg p-1 hover:bg-slate-100" onclick={onclose}>
        <X class="h-5 w-5" />
      </button>
    </div>
    {@render children()}
  </div>
</div>
