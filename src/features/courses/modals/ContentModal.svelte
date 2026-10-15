<script lang="ts">
  import { useInput } from "../../../hooks/useInput";
  import { getYoutubeEmbedUrl, notify, showWarningDialog } from "../../../helpers/toolsHelper";
  import Modal from "../../common/components/Modal.svelte";
  import type { CourseContent } from "../api/courseApi";
  import { addContent, editContent, mutating } from "../states/coursesStore";

  let {
    courseId,
    content = null,
    onclose,
  }: { courseId: string; content?: CourseContent | null; onclose: () => void } = $props();

  const { value: title } = useInput(content ? content.title : "");
  const { value: youtube } = useInput(content ? content.youtube : "");

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!$title.trim()) {
      await showWarningDialog("Judul materi wajib diisi.");
      return;
    }
    if (!getYoutubeEmbedUrl($youtube)) {
      await showWarningDialog("Masukkan tautan YouTube yang valid.");
      return;
    }

    const input = { title: $title.trim(), youtube: $youtube.trim() };
    const result = content
      ? await editContent(courseId, content.id, input)
      : await addContent(courseId, input);
    if (await notify(result)) {
      onclose();
    }
  }
</script>

<Modal title={content ? "Ubah Materi" : "Tambah Materi"} {onclose}>
  <form class="space-y-4" data-testid="content-form" onsubmit={handleSubmit}>
    <div>
      <label for="content-title" class="mb-1 block text-sm font-medium">Judul materi</label>
      <input id="content-title" type="text" bind:value={$title} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
    </div>
    <div>
      <label for="content-youtube" class="mb-1 block text-sm font-medium">Tautan YouTube</label>
      <input id="content-youtube" type="url" placeholder="https://www.youtube.com/watch?v=..." bind:value={$youtube} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
    </div>
    <div class="flex justify-end gap-2">
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-100" onclick={onclose}>Batal</button>
      <button type="submit" disabled={$mutating.content} class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
        {$mutating.content ? "Menyimpan..." : "Simpan materi"}
      </button>
    </div>
  </form>
</Modal>
