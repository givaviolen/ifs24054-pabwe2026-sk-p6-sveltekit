<script lang="ts">
  import AuthSessionRedirect from "../../features/auth/components/AuthSessionRedirect.svelte";
  import AuthLayout from "../../features/auth/layouts/AuthLayout.svelte";

  let { children } = $props();
</script>

<AuthSessionRedirect />
<AuthLayout>
  {@render children()}
</AuthLayout>
