<script lang="ts">
  import { page } from "$app/state";
  import { BookOpen, User, Users } from "lucide-svelte";
  import { cn } from "../../../helpers/toolsHelper";

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();

  const items = [
    {
      href: "/",
      label: "Semua Kursus",
      icon: BookOpen,
      active: (path: string) => path === "/" || path.startsWith("/courses"),
    },
    {
      href: "/users",
      label: "Pengguna",
      icon: Users,
      active: (path: string) => path.startsWith("/users"),
    },
    {
      href: "/profile",
      label: "Profil Saya",
      icon: User,
      active: (path: string) => path.startsWith("/profile"),
    },
  ];
</script>

{#if open}
  <button
    type="button"
    aria-label="Tutup menu"
    class="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
    onclick={onclose}
  ></button>
{/if}

<aside
  class={cn(
    "fixed bottom-0 left-0 top-16 z-40 w-64 border-r border-slate-200 bg-white p-3 transition-transform md:translate-x-0",
    open ? "translate-x-0" : "-translate-x-full"
  )}
>
  <nav class="space-y-1" aria-label="Menu utama">
    {#each items as item (item.href)}
      <a
        href={item.href}
        onclick={onclose}
        class={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100",
          item.active(page.url.pathname) && "bg-indigo-50 text-indigo-700"
        )}
      >
        <item.icon class="h-5 w-5" />
        {item.label}
      </a>
    {/each}
  </nav>
</aside>
