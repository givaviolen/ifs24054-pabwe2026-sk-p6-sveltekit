import { get } from "svelte/store";
import { describe, expect, it } from "vitest";
import { useInput } from "./useInput";

describe("useInput", () => {
  it("menyimpan nilai awal, memperbarui, dan mengatur ulang", () => {
    const { value, reset } = useInput("awal");
    expect(get(value)).toBe("awal");

    value.set("baru");
    expect(get(value)).toBe("baru");

    reset();
    expect(get(value)).toBe("awal");
  });
});
