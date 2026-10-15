<script lang="ts">
  import { notify, pickFile, showWarningDialog } from "../../../helpers/toolsHelper";
  import Modal from "../../common/components/Modal.svelte";
  import { editCover, mutating } from "../states/coursesStore";

  let { courseId, onclose }: { courseId: string; onclose: () => void } = $props();

  let file = $state<File | undefined>(undefined);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!file) {
      await showWarningDialog("Pilih gambar sampul terlebih dahulu.");
      return;
    }
    if (await notify(await editCover(courseId, file))) {
      onclose();
    }
  }
</script>

<Modal title="Ubah Sampul" {onclose}>
  <form class="space-y-4" data-testid="change-cover-form" onsubmit={handleSubmit}>
    <input type="file" accept="image/*" aria-label="Pilih sampul" onchange={(event) => (file = pickFile(event))} class="block w-full text-sm" />
    <div class="flex justify-end gap-2">
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-100" onclick={onclose}>Batal</button>
      <button type="submit" disabled={$mutating.cover} class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
        {$mutating.cover ? "Mengunggah..." : "Unggah sampul"}
      </button>
    </div>
  </form>
</Modal>
