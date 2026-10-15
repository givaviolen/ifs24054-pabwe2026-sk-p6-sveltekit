<script lang="ts">
  import { goto } from "$app/navigation";
  import { isLoggedIn, sessionReady } from "../../auth/states/authStore";
  import Navbar from "../components/Navbar.svelte";
  import Sidebar from "../components/Sidebar.svelte";

  let { children } = $props();
  let sidebarOpen = $state(false);

  // Pengguna yang belum masuk diarahkan ke halaman login setelah sesi dicek.
  $effect(() => {
    if ($sessionReady && !$isLoggedIn) {
      goto("/auth/login");
    }
  });
</script>

{#if $isLoggedIn}
  <div class="min-h-screen">
    <Navbar ontoggle={() => (sidebarOpen = !sidebarOpen)} />
    <Sidebar open={sidebarOpen} onclose={() => (sidebarOpen = false)} />
    <main class="pt-16 md:pl-64">
      <div class="mx-auto max-w-5xl p-4 sm:p-6">
        {@render children()}
      </div>
    </main>
  </div>
{:else}
  <div class="flex min-h-screen items-center justify-center text-slate-500">Memuat sesi...</div>
{/if}
