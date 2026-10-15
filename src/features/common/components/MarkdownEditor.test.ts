import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import MarkdownEditor from "./MarkdownEditor.svelte";

const g = globalThis as any;

describe("MarkdownEditor", () => {
  it("membuat editor dengan nilai awal dan membersihkannya saat dilepas", () => {
    const { unmount } = render(MarkdownEditor, { props: { value: "Halo" } });

    expect(screen.getByTestId("markdown-editor")).toBeInTheDocument();
    expect(g.__editor.options.initialValue).toBe("Halo");
    expect(g.__editor.options.usageStatistics).toBe(false);

    g.__markdown = "Halo dunia";
    expect(() => g.__editor.options.events.change()).not.toThrow();

    unmount();
    expect(g.__editorDestroyed).toBe(true);
  });

  it("memakai nilai awal kosong secara bawaan", () => {
    render(MarkdownEditor);
    expect(g.__editor.options.initialValue).toBe("");
  });
});
