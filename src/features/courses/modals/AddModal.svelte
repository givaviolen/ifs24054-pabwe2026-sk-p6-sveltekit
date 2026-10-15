<script lang="ts">
  import { useInput } from "../../../hooks/useInput";
  import { notify, showWarningDialog } from "../../../helpers/toolsHelper";
  import MarkdownEditor from "../../common/components/MarkdownEditor.svelte";
  import Modal from "../../common/components/Modal.svelte";
  import { createCourse, mutating } from "../states/coursesStore";

  let { onclose }: { onclose: () => void } = $props();

  const { value: title } = useInput("");
  let description = $state("");

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!$title.trim()) {
      await showWarningDialog("Judul kursus wajib diisi.");
      return;
    }
    if (await notify(await createCourse({ title: $title.trim(), description }))) {
      onclose();
    }
  }
</script>

<Modal title="Tambah Kursus" {onclose}>
  <form class="space-y-4" data-testid="add-course-form" onsubmit={handleSubmit}>
    <div>
      <label for="add-title" class="mb-1 block text-sm font-medium">Judul</label>
      <input id="add-title" type="text" bind:value={$title} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
    </div>
    <div>
      <span class="mb-1 block text-sm font-medium">Deskripsi</span>
      <MarkdownEditor bind:value={description} />
    </div>
    <div class="flex justify-end gap-2">
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-100" onclick={onclose}>Batal</button>
      <button type="submit" disabled={$mutating.add} class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
        {$mutating.add ? "Menyimpan..." : "Simpan"}
      </button>
    </div>
  </form>
</Modal>
