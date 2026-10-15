<script lang="ts">
  import { goto } from "$app/navigation";
  import { UserPlus } from "lucide-svelte";
  import { useInput } from "../../../hooks/useInput";
  import { notify, showWarningDialog } from "../../../helpers/toolsHelper";
  import { authLoading, register } from "../states/authStore";

  const { value: name } = useInput("");
  const { value: email } = useInput("");
  const { value: password } = useInput("");
  const { value: confirm } = useInput("");

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!$name.trim() || !$email.trim() || !$password) {
      await showWarningDialog("Nama, email, dan kata sandi wajib diisi.");
      return;
    }
    if ($password !== $confirm) {
      await showWarningDialog("Konfirmasi kata sandi tidak sama.");
      return;
    }

    const result = await register({
      name: $name.trim(),
      email: $email.trim(),
      password: $password,
    });
    if (await notify(result)) {
      await goto("/auth/login");
    }
  }
</script>

<h2 class="text-2xl font-bold">Buat akun baru</h2>
<p class="mt-1 text-sm text-slate-500">Daftar untuk mengikuti atau membuat kursus.</p>

<form class="mt-8 space-y-4" data-testid="register-form" onsubmit={handleSubmit}>
  <div>
    <label for="name" class="mb-1 block text-sm font-medium">Nama</label>
    <input
      id="name"
      type="text"
      bind:value={$name}
      autocomplete="name"
      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
    />
  </div>
  <div>
    <label for="email" class="mb-1 block text-sm font-medium">Email</label>
    <input
      id="email"
      type="email"
      bind:value={$email}
      autocomplete="email"
      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
    />
  </div>
  <div>
    <label for="password" class="mb-1 block text-sm font-medium">Kata sandi</label>
    <input
      id="password"
      type="password"
      bind:value={$password}
      autocomplete="new-password"
      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
    />
  </div>
  <div>
    <label for="confirm" class="mb-1 block text-sm font-medium">Ulangi kata sandi</label>
    <input
      id="confirm"
      type="password"
      bind:value={$confirm}
      autocomplete="new-password"
      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
    />
  </div>
  <button
    type="submit"
    disabled={$authLoading}
    class="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
  >
    <UserPlus class="h-4 w-4" />
    {$authLoading ? "Memproses..." : "Daftar"}
  </button>
</form>

<p class="mt-6 text-center text-sm text-slate-500">
  Sudah punya akun?
  <a href="/auth/login" class="font-semibold text-indigo-600 hover:underline">Masuk</a>
</p>
