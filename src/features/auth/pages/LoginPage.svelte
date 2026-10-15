<script lang="ts">
  import { goto } from "$app/navigation";
  import { LogIn } from "lucide-svelte";
  import { useInput } from "../../../hooks/useInput";
  import { showErrorDialog, showWarningDialog } from "../../../helpers/toolsHelper";
  import { authLoading, login } from "../states/authStore";

  const { value: email } = useInput("");
  const { value: password } = useInput("");

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!$email.trim() || !$password) {
      await showWarningDialog("Email dan kata sandi wajib diisi.");
      return;
    }

    const result = await login({ email: $email.trim(), password: $password });
    if (result.ok) {
      await goto("/");
    } else {
      await showErrorDialog(result.message);
    }
  }
</script>

<h2 class="text-2xl font-bold">Masuk ke akunmu</h2>
<p class="mt-1 text-sm text-slate-500">Lanjutkan belajar dari kursus terakhirmu.</p>

<form class="mt-8 space-y-4" data-testid="login-form" onsubmit={handleSubmit}>
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
      autocomplete="current-password"
      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
    />
  </div>
  <button
    type="submit"
    disabled={$authLoading}
    class="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
  >
    <LogIn class="h-4 w-4" />
    {$authLoading ? "Memproses..." : "Masuk"}
  </button>
</form>

<p class="mt-6 text-center text-sm text-slate-500">
  Belum punya akun?
  <a href="/auth/register" class="font-semibold text-indigo-600 hover:underline">Daftar</a>
</p>
