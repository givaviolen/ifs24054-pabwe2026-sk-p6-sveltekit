<script lang="ts">
  import Editor from "@toast-ui/editor";
  import "@toast-ui/editor/dist/toastui-editor.css";
  import { onMount } from "svelte";

  let { value = $bindable("") }: { value?: string } = $props();
  let host: HTMLDivElement;

  onMount(() => {
    const editor = new Editor({
      el: host,
      initialValue: value,
      height: "220px",
      initialEditType: "markdown",
      previewStyle: "tab",
      usageStatistics: false,
      events: {
        change: () => {
          value = editor.getMarkdown();
        },
      },
    });
    return () => editor.destroy();
  });
</script>

<div bind:this={host} data-testid="markdown-editor"></div>
