import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";
import { page } from "$app/state";

// Catatan: berkas ini sengaja tidak mengimpor modul aplikasi, supaya vi.mock
// di tiap berkas uji tetap berlaku untuk modul tersebut.

vi.mock("$app/navigation", () => ({ goto: vi.fn() }));

vi.mock("$app/state", () => ({
  page: {
    url: new URL("http://localhost/"),
    params: {},
    status: 200,
    error: null,
  },
}));

vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) },
}));

vi.mock("lucide-svelte", () => {
  const Icon = () => {};
  return {
    ArrowLeft: Icon,
    BookOpen: Icon,
    Camera: Icon,
    Check: Icon,
    GraduationCap: Icon,
    Image: Icon,
    Lock: Icon,
    LogIn: Icon,
    LogOut: Icon,
    Menu: Icon,
    Pencil: Icon,
    Play: Icon,
    Plus: Icon,
    Search: Icon,
    Star: Icon,
    Trash2: Icon,
    User: Icon,
    UserPlus: Icon,
    Users: Icon,
    Video: Icon,
    X: Icon,
  };
});

vi.mock("@toast-ui/editor", () => {
  class Editor {
    options: any;
    constructor(options: any) {
      this.options = options;
      (globalThis as any).__editor = this;
      (globalThis as any).__editorDestroyed = false;
    }
    getMarkdown() {
      return (globalThis as any).__markdown ?? "";
    }
    destroy() {
      (globalThis as any).__editorDestroyed = true;
    }
  }
  return { default: Editor };
});

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  (page as any).url = new URL("http://localhost/");
  (page as any).params = {};
  (globalThis as any).__markdown = "";
});
