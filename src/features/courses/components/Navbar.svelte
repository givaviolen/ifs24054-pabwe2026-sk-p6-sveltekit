<script lang="ts">
  import { goto } from "$app/navigation";
  import { GraduationCap, LogOut, Menu } from "lucide-svelte";
  import { showConfirmDialog } from "../../../helpers/toolsHelper";
  import { logout, profile } from "../../auth/states/authStore";

  let { ontoggle }: { ontoggle: () => void } = $props();

  async function handleLogout() {
    if (await showConfirmDialog("Anda akan keluar dari akun ini.", "Keluar?", "Ya, keluar")) {
      logout();
      await goto("/auth/login");
    }
  }
</script>

<header class="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
  <div class="flex items-center gap-3">
    <button type="button" aria-label="Buka menu" class="rounded-lg p-2 hover:bg-slate-100 md:hidden" onclick={ontoggle}>
      <Menu class="h-5 w-5" />
    </button>
    <a href="/" class="flex items-center gap-2 font-bold text-indigo-700">
      <GraduationCap class="h-7 w-7" />
      <span>Delcom Courses</span>
    </a>
  </div>

  <div class="flex items-center gap-3">
    <a href="/profile" class="flex items-center gap-2 text-sm font-medium">
      {#if $profile?.photo}
        <img
          src={$profile.photo}
          alt="Foto profil"
          width="32"
          height="32"
          decoding="async"
          class="h-8 w-8 rounded-full object-cover"
        />
      {:else}
        <span class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
          {$profile ? $profile.name.charAt(0).toUpperCase() : "?"}
        </span>
      {/if}
      <span class="hidden sm:inline">{$profile ? $profile.name : ""}</span>
    </a>
    <button type="button" aria-label="Keluar" class="rounded-lg p-2 text-slate-600 hover:bg-slate-100" onclick={handleLogout}>
      <LogOut class="h-5 w-5" />
    </button>
  </div>
</header>