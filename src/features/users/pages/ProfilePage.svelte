<script lang="ts">
  import { get } from "svelte/store";
  import { Camera } from "lucide-svelte";
  import { useInput } from "../../../hooks/useInput";
  import { notify, pickFile, showWarningDialog } from "../../../helpers/toolsHelper";
  import { profile } from "../../auth/states/authStore";
  import { profileBusy, savePassword, savePhoto, saveProfile } from "../states/usersStore";

  const initial = get(profile)!;
  const { value: name } = useInput(initial.name);
  const { value: email } = useInput(initial.email);
  const { value: current, reset: resetCurrent } = useInput("");
  const { value: next, reset: resetNext } = useInput("");
  const { value: confirm, reset: resetConfirm } = useInput("");
  let photo = $state<File | undefined>(undefined);

  const user = $derived($profile!);

  async function submitProfile(event: SubmitEvent) {
    event.preventDefault();
    if (!$name.trim() || !$email.trim()) {
      await showWarningDialog("Nama dan email wajib diisi.");
      return;
    }
    await notify(await saveProfile({ name: $name.trim(), email: $email.trim() }));
  }

  async function submitPhoto(event: SubmitEvent) {
    event.preventDefault();
    if (!photo) {
      await showWarningDialog("Pilih foto terlebih dahulu.");
      return;
    }
    await notify(await savePhoto(photo));
  }

  async function submitPassword(event: SubmitEvent) {
    event.preventDefault();
    if (!$current || !$next) {
      await showWarningDialog("Kata sandi lama dan baru wajib diisi.");
      return;
    }
    if ($next !== $confirm) {
      await showWarningDialog("Konfirmasi kata sandi baru tidak sama.");
      return;
    }
    const ok = await notify(await savePassword({ password: $current, new_password: $next }));
    if (ok) {
      resetCurrent();
      resetNext();
      resetConfirm();
    }
  }
</script>

<section class="space-y-6">
  <div class="flex items-center gap-4">
    {#if user.photo}
      <img
        src={user.photo}
        alt={user.name}
        width="80"
        height="80"
        fetchpriority="high"
        decoding="async"
        class="h-20 w-20 rounded-full object-cover"
      />
    {:else}
      <span class="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-3xl font-bold text-indigo-700">
        {user.name.charAt(0).toUpperCase()}
      </span>
    {/if}
    <div>
      <h1 class="text-2xl font-bold">{user.name}</h1>
      <p class="text-sm text-slate-500">{user.email}</p>
    </div>
  </div>

  <form class="space-y-4 rounded-xl border border-slate-200 bg-white p-5" data-testid="profile-form" onsubmit={submitProfile}>
    <h2 class="font-bold">Data diri</h2>
    <div>
      <label for="profile-name" class="mb-1 block text-sm font-medium">Nama</label>
      <input id="profile-name" type="text" bind:value={$name} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
    </div>
    <div>
      <label for="profile-email" class="mb-1 block text-sm font-medium">Email</label>
      <input id="profile-email" type="email" bind:value={$email} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
    </div>
    <button type="submit" disabled={$profileBusy} class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">Simpan data diri</button>
  </form>

  <form class="space-y-4 rounded-xl border border-slate-200 bg-white p-5" data-testid="photo-form" onsubmit={submitPhoto}>
    <h2 class="font-bold">Foto profil</h2>
    <input type="file" accept="image/*" aria-label="Pilih foto" onchange={(event) => (photo = pickFile(event))} class="block w-full text-sm" />
    <button type="submit" disabled={$profileBusy} class="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
      <Camera class="h-4 w-4" />
      Unggah foto
    </button>
  </form>

  <form class="space-y-4 rounded-xl border border-slate-200 bg-white p-5" data-testid="password-form" onsubmit={submitPassword}>
    <h2 class="font-bold">Ubah kata sandi</h2>
    <div>
      <label for="current-password" class="mb-1 block text-sm font-medium">Kata sandi lama</label>
      <input id="current-password" type="password" bind:value={$current} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
    </div>
    <div>
      <label for="new-password" class="mb-1 block text-sm font-medium">Kata sandi baru</label>
      <input id="new-password" type="password" bind:value={$next} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
    </div>
    <div>
      <label for="confirm-password" class="mb-1 block text-sm font-medium">Ulangi kata sandi baru</label>
      <input id="confirm-password" type="password" bind:value={$confirm} class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
    </div>
    <button type="submit" disabled={$profileBusy} class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">Ubah kata sandi</button>
  </form>
</section>