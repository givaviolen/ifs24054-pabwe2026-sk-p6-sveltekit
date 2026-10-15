<script lang="ts">
  import { onMount } from "svelte";
  import { Search } from "lucide-svelte";
  import { formatDate } from "../../../helpers/toolsHelper";
  import { loadUsers, users, usersLoading } from "../states/usersStore";

  let query = $state("");

  const filtered = $derived(
    $users.filter((user) => {
      const keyword = query.toLowerCase();
      return (
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      );
    })
  );

  onMount(() => {
    loadUsers();
  });
</script>

<section>
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold">Pengguna</h1>
      <p class="text-sm text-slate-500">Semua pengguna yang terdaftar di Delcom Courses.</p>
    </div>
    <div class="relative w-full sm:w-72">
      <Search class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
      <input
        type="search"
        placeholder="Cari nama atau email"
        aria-label="Cari pengguna"
        bind:value={query}
        class="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  </div>

  {#if $usersLoading}
    <p class="mt-10 text-center text-slate-500">Memuat pengguna...</p>
  {:else if filtered.length === 0}
    <p class="mt-10 text-center text-slate-500">Tidak ada pengguna yang cocok.</p>
  {:else}
    <ul class="mt-6 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {#each filtered as user (user.id)}
        <li class="flex items-center gap-4 p-4">
          {#if user.photo}
            <img src={user.photo} alt={user.name} class="h-11 w-11 rounded-full object-cover" />
          {:else}
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              {user.name.charAt(0).toUpperCase()}
            </span>
          {/if}
          <div class="min-w-0 flex-1">
            <p class="truncate font-semibold">{user.name}</p>
            <p class="truncate text-sm text-slate-500">{user.email}</p>
          </div>
          <p class="hidden text-xs text-slate-400 sm:block">Bergabung {formatDate(user.created_at)}</p>
        </li>
      {/each}
    </ul>
  {/if}
</section>
