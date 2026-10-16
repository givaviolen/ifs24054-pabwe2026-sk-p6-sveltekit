<script lang="ts">
  import { onMount } from "svelte";
  import { ArrowLeft, Check } from "lucide-svelte";
  import { getYoutubeEmbedUrl, notify } from "../../../helpers/toolsHelper";
  import { content, contentLoading, loadContent, mutating, setLearned } from "../states/coursesStore";

  let { courseId, contentId }: { courseId: string; contentId: string } = $props();

  const embedUrl = $derived($content ? getYoutubeEmbedUrl($content.youtube) : "");

  onMount(() => {
    content.set(null);
    loadContent(contentId);
  });
</script>

<a href={`/courses/${courseId}`} class="mb-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline">
  <ArrowLeft class="h-4 w-4" /> Kembali ke kursus
</a>

{#if $contentLoading && !$content}
  <h1 class="py-16 text-center text-base font-normal text-slate-500">Memuat materi...</h1>
{:else if !$content}
  <h1 class="py-16 text-center text-base font-semibold">Materi tidak ditemukan</h1>
{:else}
  <article class="space-y-4">
    <h1 class="text-2xl font-bold">{$content.title}</h1>

    {#if embedUrl}
      <div class="aspect-video overflow-hidden rounded-xl bg-black">
        <iframe
          src={embedUrl}
          title={$content.title}
          class="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    {:else}
      <p class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Tautan video tidak valid, sehingga pemutar tidak dapat ditampilkan.
      </p>
    {/if}

    <button
      type="button"
      disabled={$mutating.learn}
      onclick={async () => notify(await setLearned(contentId, !$content.learned))}
      class="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
    >
      <Check class="h-4 w-4" />
      {$content.learned ? "Tandai belum selesai" : "Tandai selesai"}
    </button>
  </article>
{/if}